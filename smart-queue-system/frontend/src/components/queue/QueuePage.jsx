import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import toast from 'react-hot-toast';
import { orgAPI, tokenAPI, staffAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function QueuePage() {
  const { orgId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [phone, setPhone] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [staffSelectedDate, setStaffSelectedDate] = useState(''); // For staff date selection
  const [availableDates, setAvailableDates] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotMessage, setSlotMessage] = useState('');
  const [generatedToken, setGeneratedToken] = useState(null);
  const [queueData, setQueueData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [availability, setAvailability] = useState(null);
  const [stats, setStats] = useState({});
  const stompClient = useRef(null);

  const org = state?.org;
  const isStaff = user?.role === 'STAFF';

  useEffect(() => {
    loadServices();
    if (!isStaff) {
      checkAvailability();
      updateAvailableDates();
    } else {
      // Initialize staff date to today
      const today = new Date().toISOString().split('T')[0];
      setStaffSelectedDate(today);
    }
    return () => stompClient.current?.deactivate();
  }, []);

  useEffect(() => {
    if (isStaff && selectedService && staffSelectedDate) {
      loadQueue();
      loadStats();
    }
  }, [selectedService, staffSelectedDate]);
  
  useEffect(() => {
    if (!isStaff && selectedService && selectedDate) {
      loadTimeSlots();
    }
  }, [selectedService, selectedDate]);
  
  const updateAvailableDates = () => {
    const dates = [];
    const today = new Date();
    const currentHour = today.getHours();
    const todayStr = today.toISOString().split('T')[0];
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    // Show today if before 5 PM (17:00)
    if (currentHour < 17) {
      dates.push({
        value: todayStr,
        label: 'Today',
        fullLabel: `Today (${today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`
      });
    }
    
    // Always add tomorrow
    dates.push({
      value: tomorrowStr,
      label: 'Tomorrow',
      fullLabel: `Tomorrow (${tomorrow.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`
    });
    
    setAvailableDates(dates);
    // Default to today if before 5 PM, otherwise tomorrow
    setSelectedDate(currentHour < 17 ? todayStr : tomorrowStr);
  };

  const checkAvailability = async () => {
    try {
      const res = await orgAPI.checkAvailability(orgId);
      setAvailability(res.data);
    } catch {
      toast.error('Failed to check availability');
    }
  };

  const loadServices = async () => {
    try {
      const res = await orgAPI.getServices(orgId);
      // Filter to show only active services
      const activeServices = res.data.filter(svc => svc.active !== false);
      setServices(activeServices);
    } catch {
      toast.error('Failed to load services');
    }
  };
  
  const loadTimeSlots = async () => {
    if (!selectedService || !selectedDate) return;
    
    setLoadingSlots(true);
    setSlotMessage('');
    try {
      const res = await tokenAPI.getAvailableSlots(selectedService.id, selectedDate);
      setTimeSlots(res.data.slots || []);
      
      if (res.data.message) {
        setSlotMessage(res.data.message);
      }
      
      // If canBookToday is false and trying to view today, show message
      if (res.data.canBookToday === false && selectedDate === new Date().toISOString().split('T')[0]) {
        toast.error(res.data.message, { duration: 5000 });
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to load time slots';
      toast.error(errorMsg);
      setTimeSlots([]);
      setSlotMessage(errorMsg);
    } finally {
      setLoadingSlots(false);
    }
  };

  const loadQueue = async () => {
    try {
      // Get all tokens for the service for the selected date
      const res = await staffAPI.getQueue(selectedService.id, staffSelectedDate);
      setQueueData(res.data);
    } catch {
      toast.error('Failed to load queue');
    }
  };

  const loadStats = async () => {
    try {
      const res = await tokenAPI.getDailyStats(orgId);
      setStats(res.data);
    } catch {}
  };

  const callNext = async () => {
    try {
      await staffAPI.callNext(selectedService.id);
      toast.success('Next token called! Email sent to customer.');
      loadQueue();
      loadStats();
    } catch {
      toast.error('Failed to call next token');
    }
  };

  const markAttendance = async (tokenId, attended) => {
    try {
      await staffAPI.markAttendance(tokenId, attended);
      toast.success(attended ? '✅ Marked as attended' : '❌ Marked as absent');
      loadQueue();
      loadStats();
    } catch {
      toast.error('Failed to mark attendance');
    }
  };

  const connectWebSocket = (serviceId) => {
    const client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
      onConnect: () => {
        client.subscribe(`/topic/queue/${serviceId}`, (msg) => {
          setQueueData(JSON.parse(msg.body));
        });
      }
    });
    client.activate();
    stompClient.current = client;
  };

  const generateToken = async () => {
    if (!selectedService) return toast.error('Please select a service');
    if (!selectedSlot) return toast.error('Please select a time slot');
    
    // Only block for hospitals if not available
    if (org?.type === 'HOSPITAL' && availability && !availability.available) {
      return toast.error(availability.message || 'Service not available now');
    }
    
    setLoading(true);
    try {
      const res = await tokenAPI.generate({
        serviceId: selectedService.id,
        organizationId: parseInt(orgId),
        phoneNumber: phone || 'N/A', // Make phone optional
        appointmentTime: selectedSlot.dateTime
      });
      setGeneratedToken(res.data);
      connectWebSocket(selectedService.id);
      toast.success('Token generated successfully!');
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.response?.data?.message || 'Failed to generate token';
      toast.error(errorMsg, { duration: 5000 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <nav style={styles.nav}>
        <button onClick={() => navigate('/dashboard')} style={styles.backBtn}>← Back</button>
        <span style={styles.navTitle}>{org?.name || 'Queue System'}</span>
        <span />
      </nav>

      <div style={styles.content}>
        {/* STAFF VIEW - Service Selection and Bookings */}
        {isStaff ? (
          <>
            <h2 style={styles.sectionTitle}>Select a Service to View Bookings</h2>

            <div style={styles.serviceGrid}>
              {services.map(svc => (
                <div key={svc.id} onClick={() => setSelectedService(svc)}
                  style={{ ...styles.serviceCard, 
                    background: selectedService?.id === svc.id ? '#e8f4fd' : 'white',
                    border: selectedService?.id === svc.id ? '3px solid #667eea' : '2px solid #eee' }}>
                  <div style={styles.serviceIcon}>🏥</div>
                  <h3 style={styles.serviceName}>{svc.name}</h3>
                  <p style={styles.serviceDesc}>{svc.description}</p>
                  <p style={styles.serviceTime}>~{svc.avgWaitTime} min wait</p>
                </div>
              ))}
            </div>

            {/* Bookings List for Selected Service */}
            {selectedService && (
              <div style={styles.bookingsContainer}>
                <div style={styles.bookingsHeader}>
                  <h3 style={styles.bookingsTitle}>
                    📋 Bookings for {selectedService.name}
                  </h3>
                  <div style={styles.headerRight}>
                    <div style={styles.dateSelector}>
                      <button
                        onClick={() => {
                          const today = new Date().toISOString().split('T')[0];
                          setStaffSelectedDate(today);
                        }}
                        style={{
                          ...styles.dateSelectorBtn,
                          ...(staffSelectedDate === new Date().toISOString().split('T')[0] && styles.dateSelectorBtnActive)
                        }}>
                        Today
                      </button>
                      <button
                        onClick={() => {
                          const tomorrow = new Date();
                          tomorrow.setDate(tomorrow.getDate() + 1);
                          setStaffSelectedDate(tomorrow.toISOString().split('T')[0]);
                        }}
                        style={{
                          ...styles.dateSelectorBtn,
                          ...(staffSelectedDate !== new Date().toISOString().split('T')[0] && styles.dateSelectorBtnActive)
                        }}>
                        Tomorrow
                      </button>
                    </div>
                    <span style={styles.bookingsCount}>
                      {queueData.length} {queueData.length === 1 ? 'booking' : 'bookings'}
                    </span>
                  </div>
                </div>

                {queueData.length > 0 ? (
                  <div style={styles.bookingsList}>
                    {queueData.map((booking, index) => (
                      <div key={booking.id} style={{
                        ...styles.bookingCard,
                        ...(booking.status === 'SERVING' && styles.calledBookingCard)
                      }}>
                        {booking.status === 'SERVING' && (
                          <div style={styles.calledBanner}>
                            🔔 TOKEN CALLED - Waiting for customer to attend
                          </div>
                        )}
                        
                        <div style={styles.bookingHeader}>
                          <div style={styles.bookingNumber}>
                            <span style={{
                              ...styles.tokenBadge,
                              ...(booking.status === 'SERVING' && { background: '#f39c12', animation: 'pulse 2s infinite' })
                            }}>{booking.tokenNumber}</span>
                            <span style={styles.queuePosition}>Position #{index + 1}</span>
                          </div>
                          <span style={{
                            ...styles.statusBadge,
                            background: booking.status === 'WAITING' ? '#95a5a6' : 
                                       booking.status === 'SERVING' ? '#f39c12' :
                                       booking.status === 'COMPLETED' ? '#2ecc71' : '#e74c3c'
                          }}>
                            {booking.status === 'SERVING' ? '🔔 CALLED' : booking.status}
                          </span>
                        </div>

                        <div style={styles.bookingDetails}>
                          <div style={styles.bookingRow}>
                            <span style={styles.bookingLabel}>👤 Name:</span>
                            <span style={styles.bookingValue}>{booking.user?.name || 'N/A'}</span>
                          </div>
                          
                          <div style={styles.bookingRow}>
                            <span style={styles.bookingLabel}>📧 Email:</span>
                            <span style={styles.bookingValue}>{booking.user?.email || 'N/A'}</span>
                          </div>
                          
                          <div style={styles.bookingRow}>
                            <span style={styles.bookingLabel}>📞 Phone:</span>
                            <span style={styles.bookingValue}>{booking.phoneNumber}</span>
                          </div>
                          
                          {booking.appointmentTime && (
                            <div style={styles.bookingRow}>
                              <span style={styles.bookingLabel}>🕐 Appointment:</span>
                              <span style={styles.bookingValue}>
                                {new Date(booking.appointmentTime).toLocaleString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: 'numeric',
                                  minute: '2-digit',
                                  hour12: true
                                })}
                              </span>
                            </div>
                          )}

                          <div style={styles.bookingRow}>
                            <span style={styles.bookingLabel}>⏰ Generated:</span>
                            <span style={styles.bookingValue}>
                              {new Date(booking.createdAt).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true
                              })}
                            </span>
                          </div>
                          
                          {booking.calledAt && (
                            <div style={styles.bookingRow}>
                              <span style={styles.bookingLabel}>📣 Called At:</span>
                              <span style={styles.bookingValue}>
                                {new Date(booking.calledAt).toLocaleString('en-US', {
                                  hour: 'numeric',
                                  minute: '2-digit',
                                  hour12: true
                                })}
                              </span>
                            </div>
                          )}
                        </div>

                        <div style={styles.bookingActions}>
                          {(() => {
                            // Calculate if we're within 30 minutes of appointment time
                            const now = new Date();
                            const appointmentTime = booking.appointmentTime ? new Date(booking.appointmentTime) : null;
                            const minutesUntilAppointment = appointmentTime ? 
                              Math.floor((appointmentTime.getTime() - now.getTime()) / (1000 * 60)) : 999;
                            const canManage = minutesUntilAppointment <= 30;
                            
                            return (
                              <>
                                <button 
                                  onClick={() => callNext()}
                                  disabled={booking.status !== 'WAITING' || !canManage}
                                  style={{
                                    ...styles.actionBtn,
                                    background: (booking.status === 'WAITING' && canManage) ? '#3498db' : '#ccc',
                                    cursor: (booking.status === 'WAITING' && canManage) ? 'pointer' : 'not-allowed'
                                  }}
                                  title={!canManage ? `Available ${minutesUntilAppointment} min before appointment` : ''}>
                                  📣 Call
                                </button>
                                <button 
                                  onClick={() => markAttendance(booking.id, true)}
                                  disabled={booking.status === 'COMPLETED' || booking.status === 'CANCELLED' || !canManage}
                                  style={{
                                    ...styles.actionBtn,
                                    background: (booking.status !== 'COMPLETED' && booking.status !== 'CANCELLED' && canManage) ? '#2ecc71' : '#ccc',
                                    cursor: (booking.status !== 'COMPLETED' && booking.status !== 'CANCELLED' && canManage) ? 'pointer' : 'not-allowed'
                                  }}
                                  title={!canManage ? `Available ${minutesUntilAppointment} min before appointment` : ''}>
                                  ✓ Attended
                                </button>
                                <button 
                                  onClick={() => markAttendance(booking.id, false)}
                                  disabled={booking.status === 'CANCELLED' || booking.status === 'COMPLETED' || !canManage}
                                  style={{
                                    ...styles.actionBtn,
                                    background: (booking.status !== 'CANCELLED' && booking.status !== 'COMPLETED' && canManage) ? '#e74c3c' : '#ccc',
                                    cursor: (booking.status !== 'CANCELLED' && booking.status !== 'COMPLETED' && canManage) ? 'pointer' : 'not-allowed'
                                  }}
                                  title={!canManage ? `Available ${minutesUntilAppointment} min before appointment` : ''}>
                                  ✗ Absent
                                </button>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={styles.emptyState}>
                    <div style={styles.emptyIcon}>📭</div>
                    <p style={styles.emptyText}>No bookings yet for this service</p>
                  </div>
                )}
              </div>
            )}
          </>
        ) : !generatedToken ? (
          <>
            {/* CUSTOMER VIEW - Token Generation */}
            <h2 style={styles.sectionTitle}>Select a Service</h2>
            
            {org?.type === 'HOSPITAL' && availability && !availability.available && (
              <div style={styles.unavailableAlert}>
                ⚠️ {availability.message || 'Service not available now'}
              </div>
            )}
            
            {org?.type === 'HOSPITAL' && availability?.available && (
              <div style={styles.infoAlert}>
                ✅ Service available now
              </div>
            )}

            <div style={styles.serviceGrid}>
              {services.map(svc => (
                <div key={svc.id} onClick={() => setSelectedService(svc)}
                  style={{ ...styles.serviceCard, 
                    background: selectedService?.id === svc.id ? '#e8f4fd' : 'white',
                    border: selectedService?.id === svc.id ? '3px solid #667eea' : '2px solid #eee' }}>
                  <div style={styles.serviceIcon}>🏥</div>
                  <h3 style={styles.serviceName}>{svc.name}</h3>
                  <p style={styles.serviceDesc}>{svc.description}</p>
                  <p style={styles.serviceTime}>~{svc.avgWaitTime} min wait</p>
                </div>
              ))}
            </div>
            


            <div style={styles.phoneSection}>
              <label style={styles.label}>Phone Number (Optional)</label>
              <input type="tel" placeholder="Enter your phone number (optional)" value={phone} 
                onChange={e => setPhone(e.target.value)}
                style={styles.input} />
              <p style={styles.hint}>Optional - We'll send updates via email</p>
            </div>

            <div style={styles.phoneSection}>
              <label style={styles.label}>Select Date *</label>
              <div style={styles.dateButtons}>
                {availableDates.map(date => (
                  <button
                    key={date.value}
                    type="button"
                    onClick={() => {
                      setSelectedDate(date.value);
                      setSelectedSlot(null);
                    }}
                    style={{
                      ...styles.dateButton,
                      ...(selectedDate === date.value && styles.dateButtonSelected)
                    }}>
                    {date.fullLabel}
                  </button>
                ))}
              </div>
            </div>

            {selectedDate && (
              <div style={styles.phoneSection}>
                <label style={styles.label}>Select Time Slot *</label>
                {slotMessage && (
                  <div style={styles.slotMessageBox}>
                    {slotMessage}
                  </div>
                )}
                {loadingSlots ? (
                  <div style={styles.loadingSlots}>Loading available slots...</div>
                ) : timeSlots.length > 0 ? (
                  <div style={styles.slotsGrid}>
                    {timeSlots.map((slot, idx) => (
                      <button
                        key={idx}
                        type="button"
                        disabled={!slot.available}
                        onClick={() => setSelectedSlot(slot)}
                        style={{
                          ...styles.slotButton,
                          ...(slot.available ? {} : styles.slotButtonDisabled),
                          ...(selectedSlot?.time === slot.time && styles.slotButtonSelected)
                        }}>
                        {slot.displayTime}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div style={styles.noSlots}>
                    {slotMessage || 'No available slots for this date'}
                  </div>
                )}
              </div>
            )}

            <button onClick={generateToken} 
              disabled={loading || !selectedService || !selectedSlot || (org?.type === 'HOSPITAL' && availability && !availability.available)}
              style={{ ...styles.generateBtn, 
                opacity: (selectedService && selectedSlot && (org?.type !== 'HOSPITAL' || !availability || availability.available)) ? 1 : 0.5 }}>
              {loading ? '⏳ Generating...' : '🎫 Generate Token'}
            </button>
          </>
        ) : (
          <div style={styles.tokenDisplay}>
            <div style={styles.tokenCard}>
              <div style={styles.tokenHeader}>🎫 Your Token</div>
              <div style={styles.tokenNumber}>{generatedToken.tokenNumber}</div>
              <div style={styles.tokenDetails}>
                <div style={styles.tokenDetail}>
                  <span style={styles.detailLabel}>Service</span>
                  <span style={styles.detailValue}>{generatedToken.serviceName}</span>
                </div>
                <div style={styles.tokenDetail}>
                  <span style={styles.detailLabel}>Queue Position</span>
                  <span style={styles.detailValue}>#{generatedToken.queuePosition}</span>
                </div>
                <div style={styles.tokenDetail}>
                  <span style={styles.detailLabel}>Est. Wait</span>
                  <span style={styles.detailValue}>~{generatedToken.estimatedWaitMinutes} min</span>
                </div>
                {generatedToken.appointmentTime && (
                  <div style={styles.tokenDetail}>
                    <span style={styles.detailLabel}>Appointment Time</span>
                    <span style={styles.detailValue}>
                      {new Date(generatedToken.appointmentTime).toLocaleString('en-US', { 
                        hour: 'numeric', 
                        minute: '2-digit', 
                        hour12: true,
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                )}
                <div style={styles.tokenDetail}>
                  <span style={styles.detailLabel}>Status</span>
                  <span style={{ ...styles.detailValue, color: '#2ecc71', fontWeight: 700 }}>
                    ⏳ Waiting
                  </span>
                </div>
              </div>
              <p style={styles.reminderNote}>
                📩 You'll receive an email reminder 20 minutes before your appointment time.
              </p>
            </div>

            {queueData.length > 0 && (
              <div style={styles.queueStatus}>
                <h3 style={styles.queueTitle}>Live Queue Status</h3>
                <div style={styles.queueList}>
                  {queueData.slice(0, 5).map((t, i) => (
                    <div key={t.id} style={{ ...styles.queueItem,
                      background: t.id === generatedToken.id ? '#e8f4fd' : 'white',
                      borderLeft: t.id === generatedToken.id ? '4px solid #667eea' : '4px solid #eee' }}>
                      <span style={styles.queuePos}>#{i + 1}</span>
                      <span style={styles.queueToken}>{t.tokenNumber}</span>
                      {t.id === generatedToken.id && <span style={styles.youTag}>YOU</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button onClick={() => navigate('/dashboard')} style={styles.doneBtn}>
              Go to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: '#f5f7fa' },
  nav: { background: 'white', boxShadow: '0 2px 20px rgba(0,0,0,0.08)', padding: '16px 32px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { background: 'none', border: 'none', fontSize: 16, cursor: 'pointer', color: '#667eea', fontWeight: 600 },
  navTitle: { fontSize: 20, fontWeight: 700, color: '#1a1a2e' },
  content: { maxWidth: 900, margin: '0 auto', padding: '40px 20px' },
  sectionTitle: { fontSize: 28, fontWeight: 700, color: '#1a1a2e', marginBottom: 24 },
  serviceGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 30 },
  serviceCard: { borderRadius: 14, padding: 20, cursor: 'pointer', transition: 'all 0.2s', textAlign: 'center' },
  serviceIcon: { fontSize: 36, marginBottom: 8 },
  serviceName: { margin: 0, fontSize: 16, fontWeight: 700, color: '#1a1a2e' },
  serviceDesc: { fontSize: 13, color: '#888', margin: '6px 0' },
  serviceTime: { fontSize: 12, color: '#667eea', fontWeight: 600, margin: 0 },
  phoneSection: { marginBottom: 24, maxWidth: 360 },
  label: { display: 'block', fontSize: 14, fontWeight: 600, color: '#333', marginBottom: 6 },
  input: { width: '100%', padding: '12px 16px', border: '2px solid #e8e8e8', borderRadius: 10, fontSize: 15, outline: 'none', boxSizing: 'border-box' },
  hint: { fontSize: 12, color: '#888', marginTop: 4, marginBottom: 0 },
  infoAlert: { background: '#fff3cd', color: '#856404', padding: '16px 20px', borderRadius: 12, 
    marginBottom: 24, fontSize: 15, fontWeight: 600, textAlign: 'center', border: '2px solid #ffeaa7' },
  unavailableAlert: { background: '#ffe0e0', color: '#d00', padding: '16px 20px', borderRadius: 12, 
    marginBottom: 24, fontSize: 15, fontWeight: 600, textAlign: 'center', border: '2px solid #ffcccc' },
  generateBtn: { background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white',
    border: 'none', borderRadius: 12, padding: '16px 40px', fontSize: 18, fontWeight: 700, cursor: 'pointer' },
  tokenDisplay: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 },
  tokenCard: { background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white',
    borderRadius: 24, padding: 40, maxWidth: 420, width: '100%', textAlign: 'center',
    boxShadow: '0 20px 50px rgba(102, 126, 234, 0.4)' },
  tokenHeader: { fontSize: 16, opacity: 0.9, marginBottom: 8 },
  tokenNumber: { fontSize: 64, fontWeight: 900, letterSpacing: 4, margin: '16px 0' },
  tokenDetails: { background: 'rgba(255,255,255,0.15)', borderRadius: 14, padding: 20, marginBottom: 16 },
  tokenDetail: { display: 'flex', justifyContent: 'space-between', padding: '8px 0',
    borderBottom: '1px solid rgba(255,255,255,0.1)' },
  detailLabel: { opacity: 0.8, fontSize: 14 },
  detailValue: { fontWeight: 700, fontSize: 14 },
  reminderNote: { opacity: 0.85, fontSize: 13, margin: 0 },
  queueStatus: { background: 'white', borderRadius: 16, padding: 24, maxWidth: 420, width: '100%',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)' },
  queueTitle: { margin: '0 0 16px', fontSize: 18, fontWeight: 700 },
  queueList: { display: 'flex', flexDirection: 'column', gap: 8 },
  queueItem: { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 8 },
  queuePos: { color: '#888', fontSize: 13, width: 24 },
  queueToken: { fontWeight: 700, flex: 1 },
  youTag: { background: '#667eea', color: 'white', padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 700 },
  doneBtn: { background: 'white', border: '2px solid #667eea', color: '#667eea',
    borderRadius: 12, padding: '12px 32px', fontSize: 16, fontWeight: 600, cursor: 'pointer' },
  bookingsContainer: { marginTop: 32, background: 'white', borderRadius: 16, padding: 24, 
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)' },
  bookingsHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
    marginBottom: 24, paddingBottom: 16, borderBottom: '2px solid #f0f0f0' },
  bookingsTitle: { margin: 0, fontSize: 22, fontWeight: 700, color: '#1a1a2e' },
  headerRight: { display: 'flex', alignItems: 'center', gap: 16 },
  dateSelector: { display: 'flex', gap: 8, background: '#f5f7fa', padding: '4px', borderRadius: 8 },
  dateSelectorBtn: { padding: '8px 16px', border: 'none', background: 'transparent', 
    borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: 'pointer', 
    color: '#666', transition: 'all 0.2s' },
  dateSelectorBtnActive: { background: '#667eea', color: 'white' },
  bookingsCount: { background: '#667eea', color: 'white', padding: '6px 16px', 
    borderRadius: 20, fontSize: 14, fontWeight: 600 },
  bookingsList: { display: 'flex', flexDirection: 'column', gap: 16 },
  bookingCard: { background: '#f8f9fa', borderRadius: 12, padding: 20, 
    border: '2px solid #e8e8e8', transition: 'all 0.2s' },
  calledBookingCard: { background: '#fff8e1', border: '3px solid #f39c12', 
    boxShadow: '0 4px 20px rgba(243, 156, 18, 0.3)' },
  calledBanner: { background: '#f39c12', color: 'white', padding: '12px 16px', 
    borderRadius: 8, marginBottom: 16, fontSize: 14, fontWeight: 700, 
    textAlign: 'center', animation: 'pulse 2s infinite' },
  bookingHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
    marginBottom: 16 },
  bookingNumber: { display: 'flex', alignItems: 'center', gap: 12 },
  tokenBadge: { background: '#667eea', color: 'white', padding: '8px 16px', 
    borderRadius: 8, fontSize: 16, fontWeight: 700 },
  queuePosition: { fontSize: 14, color: '#888', fontWeight: 600 },
  statusBadge: { color: 'white', padding: '6px 14px', borderRadius: 20, 
    fontSize: 12, fontWeight: 700, textTransform: 'uppercase' },
  bookingDetails: { display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 },
  bookingRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  bookingLabel: { fontSize: 14, color: '#666', fontWeight: 600 },
  bookingValue: { fontSize: 14, color: '#1a1a2e', fontWeight: 600 },
  bookingActions: { display: 'flex', gap: 10, paddingTop: 16, borderTop: '1px solid #e0e0e0' },
  actionBtn: { flex: 1, border: 'none', color: 'white', borderRadius: 8, 
    padding: '10px 16px', fontSize: 14, fontWeight: 700, cursor: 'pointer', 
    transition: 'all 0.2s' },
  emptyState: { textAlign: 'center', padding: '60px 20px' },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyText: { fontSize: 16, color: '#888', margin: 0 },
  dateButtons: { display: 'flex', gap: 12 },
  dateButton: { flex: 1, padding: '14px 20px', border: '2px solid #e8e8e8', borderRadius: 10,
    background: 'white', fontSize: 15, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' },
  dateButtonSelected: { background: '#667eea', color: 'white', borderColor: '#667eea' },
  slotsGrid: { display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 },
  slotButton: { padding: '14px 20px', border: '2px solid #e8e8e8', borderRadius: 10,
    background: 'white', fontSize: 15, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
    width: '100%', textAlign: 'left' },
  slotButtonDisabled: { background: '#f5f5f5', color: '#ccc', cursor: 'not-allowed', 
    borderColor: '#f0f0f0' },
  slotButtonSelected: { background: '#667eea', color: 'white', borderColor: '#667eea' },
  loadingSlots: { textAlign: 'center', padding: '20px', color: '#888', fontSize: 14 },
  noSlots: { textAlign: 'center', padding: '20px', color: '#ff4757', fontSize: 14, fontWeight: 600 },
  slotMessageBox: { background: '#fff3cd', border: '2px solid #ffc107', borderRadius: 8, 
    padding: '12px 16px', marginBottom: 12, fontSize: 14, color: '#856404', fontWeight: 600 },
};
