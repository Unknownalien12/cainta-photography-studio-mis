import type { Booking, Studio } from '../db/types.js';

export function getGoogleCalendarUrl(booking: Booking, studio?: Studio): string {
  const startTime = booking.timeSlot.replace(':', '') + '00';
  const hour = parseInt(booking.timeSlot.split(':')[0], 10);
  const endHour = String(hour + 1).padStart(2, '0');
  const endTime = `${endHour}${booking.timeSlot.split(':')[1] || '00'}00`;

  const dateClean = booking.bookingDate.replace(/-/g, '');
  const dates = `${dateClean}T${startTime}/${dateClean}T${endTime}`;

  const title = encodeURIComponent(`Photoshoot Session at ${studio?.name || 'Studio'} (Ref: ${booking.id})`);
  const details = encodeURIComponent(
    `Photoshoot booking at ${studio?.name || 'Studio'}.\nClient: ${booking.customerName}\nNotes: ${booking.customerNotes || 'None'}\nAmount: ₱${booking.totalAmount}`
  );
  const location = encodeURIComponent(studio?.address || 'Cainta, Rizal');

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}`;
}

export function downloadICSFile(booking: Booking, studio?: Studio) {
  const startTime = booking.timeSlot.replace(':', '') + '00';
  const hour = parseInt(booking.timeSlot.split(':')[0], 10);
  const endHour = String(hour + 1).padStart(2, '0');
  const endTime = `${endHour}${booking.timeSlot.split(':')[1] || '00'}00`;
  const dateClean = booking.bookingDate.replace(/-/g, '');

  const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Cainta Photography Studio MIS//EN
BEGIN:VEVENT
UID:${booking.id}@cainta-studios.ph
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTSTART:${dateClean}T${startTime}
DTEND:${dateClean}T${endTime}
SUMMARY:Photoshoot at ${studio?.name || 'Studio'}
DESCRIPTION:Photography session for ${booking.customerName}. Notes: ${booking.customerNotes || ''}
LOCATION:${studio?.address || 'Cainta, Rizal'}
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `booking-${booking.id}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
