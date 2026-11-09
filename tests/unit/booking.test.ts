import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildEngineUrl, validateDates, formatDate, nightsBetween, buildMessage, whatsappUrl, mailtoUrl } from '../../src/lib/booking';

const limits = { maxAdults: 6, maxChildren: 4, minNights: 2, maxNights: 14, leadDays: 1 };

test('engine URL maps only the parameters the provider supports', () => {
  const url = new URL(buildEngineUrl(
    { provider: 'custom', url: 'https://booking.example.com/r', params: { checkIn: 'arrival', checkOut: 'departure', adults: 'adults', promo: 'code' }, dateFormat: 'DD/MM/YYYY', extra: { lang: 'en' } },
    { checkIn: '2027-03-10', checkOut: '2027-03-14', adults: 2, children: 1, accommodation: 'CLIFF', promo: ' SPRING ' },
  ));
  assert.equal(url.searchParams.get('arrival'), '10/03/2027');
  assert.equal(url.searchParams.get('departure'), '14/03/2027');
  assert.equal(url.searchParams.get('adults'), '2');
  assert.equal(url.searchParams.get('code'), 'SPRING');
  assert.equal(url.searchParams.get('lang'), 'en');
  assert.equal(url.searchParams.has('children'), false, 'unsupported params are omitted');
  assert.equal(url.searchParams.has('room'), false);
});

test('nights parameter is derived when configured', () => {
  const url = new URL(buildEngineUrl({ provider: 'custom', url: 'https://x.example.com', params: { checkIn: 'ci', nights: 'n' }, dateFormat: 'YYYY-MM-DD', extra: {} }, { checkIn: '2027-01-30', checkOut: '2027-02-02' }));
  assert.equal(url.searchParams.get('n'), '3');
});

test('date validation', () => {
  const today = '2027-01-10';
  assert.equal(validateDates({}, limits, today), 'required');
  assert.equal(validateDates({}, limits, today, false), null);
  assert.equal(validateDates({ checkIn: '2027-01-10', checkOut: '2027-01-13' }, limits, today), 'past', 'lead days respected');
  assert.equal(validateDates({ checkIn: '2027-01-15', checkOut: '2027-01-15' }, limits, today), 'order');
  assert.equal(validateDates({ checkIn: '2027-01-15', checkOut: '2027-01-14' }, limits, today), 'order');
  assert.equal(validateDates({ checkIn: '2027-01-15', checkOut: '2027-01-16' }, limits, today), 'min');
  assert.equal(validateDates({ checkIn: '2027-01-15', checkOut: '2027-02-15' }, limits, today), 'max');
  assert.equal(validateDates({ checkIn: '2027-01-15', checkOut: '2027-01-18' }, limits, today), null);
  assert.equal(validateDates({ checkIn: '2027-02-30', checkOut: '2027-03-03' }, limits, today), 'required', 'invalid calendar dates rejected');
});

test('formatting helpers', () => {
  assert.equal(formatDate('2027-12-01', 'MM/DD/YYYY'), '12/01/2027');
  assert.equal(nightsBetween('2027-03-30', '2027-04-02'), 3);
  const msg = buildMessage({ checkIn: '2027-03-01', adults: 2, accommodationName: 'Cliff Villa' }, { checkIn: 'Check-in', checkOut: 'Out', adults: 'Adults', children: 'Kids', accommodation: 'Villa', promo: 'Code' }, 'Ondara', 'Hello');
  assert.match(msg, /Check-in: 2027-03-01/);
  assert.match(msg, /Villa: Cliff Villa/);
  assert.match(whatsappUrl('5511999999999', 'a b'), /^https:\/\/wa\.me\/5511999999999\?text=a%20b$/);
  assert.match(mailtoUrl('a@b.co', 'S', 'B'), /^mailto:a@b\.co\?subject=S&body=B$/);
});
