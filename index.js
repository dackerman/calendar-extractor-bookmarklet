const version = '2020-04-24T10:52';
      
function timeToMilliseconds(time) {
    var ampm = time.substring(time.length - 2, time.length);
    var s = ampm === 'pm' ? 12 * 60 : 0;
    var hourminute = time.substring(0, time.length - 2).split(':');
    hourminute = hourminute.length === 1 ? [hourminute[0], 0] : hourminute;
    const minutes = s + (parseInt(hourminute[0]) % 12) * 60 + parseInt(hourminute[1]);
    return minutes * 60 * 1000;
}

function timeStringToDate(timeString, day) {
    const startOfDay = day;
    startOfDay.setHours(0, 0, 0, 0);
    return new Date(startOfDay.getTime() + timeToMilliseconds(timeString));
}

function pad(n, width, z) {
  z = z || '0';
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

function dateToTimeString(d) {
    const hours = d.getHours();
    const minutes = d.getMinutes();
    const ampm = hours > 11 ? 'pm' : 'am';
    const twelveHourHours = hours === 12 ? 12 : hours%12;
    return `${twelveHourHours}:${pad(minutes, 2)}${ampm}`;
}


function consolidate(ranges, tolerance=0) {
    if (ranges.length === 0) return [];
    var events = ranges.map(([start, end]) => ([{event: 'start', at: start}, {event: 'end', at: end}])).flat();
    events.sort((a,b) => (a.at - b.at));
    var depth = 0;
    var blocks = [];
    for (let i = 0; i < events.length; i++) {
        const e = events[i];
        if (e.event === 'start') {
            if (depth === 0) {
                blocks.push({start: e.at});
            }
            depth++;
        } else {
            if (depth === 1) {
                blocks[blocks.length - 1].end = e.at;
            }
            depth--;
        }
    }
    const consolidated = [{...blocks[0]}];
    let ci = 0;
    for (let i = 0; i < blocks.length - 1; i++) {
        const first = blocks[i];
        const second = blocks[i+1];
        if (first.end >= second.start - tolerance) {
            consolidated[ci].end = second.end;
        } else {
            consolidated.push({...second});
            ci++;
        }
    }
    
    return consolidated.map(({start, end}) => ([start, end]));
}

function consolidateDates(dates, gapInMs) {
    const stamps = dates.map(([s, e]) => [s.getTime(), e.getTime()]);
    const consolidatedStamps = consolidate(stamps, gapInMs);
    return consolidatedStamps.map(([s,e]) => [new Date(s), new Date(e)]);
}

function extractEventTimesFromGoogleCalendar(calendarName, day) {
    var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    var dayString = months[day.getMonth()] + ' ' + day.getDate() + ', ' + day.getFullYear();

    var allEvents = Array.prototype.slice.apply(document.querySelectorAll('div')).filter(d => d.dataset['eventchip'] === '');
    var daysEvents = allEvents.filter(d => d.innerText.includes(dayString)).filter(d => !d.innerText.includes('Declined'));

    var justWorkEvents = daysEvents.filter(d => d.innerText.includes(`Calendar: ${calendarName}`));
    if (justWorkEvents.length === 0) {
        justWorkEvents = daysEvents.filter(d => !d.innerText.includes('Calendar: '));
    }
    var times = justWorkEvents.map(d => d.innerText.split(',')[0]).join('\n');
    return times.split('\n').map(v => v.split(' to ')).filter(v => v.length === 2);    
}

function toBusyBlocks(ranges, gapInMinutes) {
    const dateRanges = ranges.map(([startTime, endTime]) => ([timeStringToDate(startTime, new Date()), timeStringToDate(endTime, new Date())]));
    var consolidated = consolidateDates(dateRanges, (gapInMinutes || 0) * 60 * 1000);
    return consolidated.map(([start, end]) => [dateToTimeString(start), dateToTimeString(end)]);
}

function drawCalendarExtractorWindow() {
    const d = document.getElementById('busyCalendarPopup') || document.createElement('div');
    d.style.width = Math.round(window.innerWidth / 3) + 'px';
    d.style.minHeight = Math.round(window.innerHeight / 3) + 'px';
    d.style.position = 'absolute';
    d.style.zIndex = '10000';
    d.style.background = 'white';
    d.style.left = d.style.width;
    d.style.top = '20px';
    d.style.border = '1px solid #ddd';
    d.style.boxShadow = '0px 0px 20px #555';
    d.style.padding = '10px 20px';
    d.id = 'busyCalendarPopup';
    d.innerHTML = '<h1>Calendar Extractor</h1>';
    const cookie = document.cookie.split(';').map(v => v.trim()).filter(v => v.startsWith('calExtractor='))[0];
    const [savedName, savedGap] = cookie ? cookie.split('=')[1].split(':') : ['Work Calendar', 5];
    const calName = document.createElement('input');
    calName.id = 'calNameInput';
    calName.setAttribute('type', 'text');
    calName.value = savedName;
    const calNameLabel = document.createElement('label');
    calNameLabel.setAttribute('for', 'calNameInput');
    calNameLabel.innerText = 'Calendar Name: ';
    d.appendChild(calNameLabel);
    d.appendChild(calName);
    d.appendChild(document.createElement('br'));
    const slider = document.createElement('input');
    slider.id = 'gapSelector';
    slider.setAttribute('type', 'range');
    slider.setAttribute('min', '0');
    slider.setAttribute('max', '60');
    slider.value = savedGap;
    const sliderLabel = document.createElement('label');
    sliderLabel.setAttribute('for', 'gapSelector');
    sliderLabel.innerText = 'Gap: ';
    d.appendChild(sliderLabel);
    d.appendChild(slider);
    const timesContainer = document.createElement('div');
    const render = () => {
        if (calName.value) {
            document.cookie = `calExtractor=${calName.value}:${slider.value}`;
            const eventTimes = extractEventTimesFromGoogleCalendar(calName.value, new Date());
            const busyBlocks = toBusyBlocks(eventTimes, Number(slider.value));
            const text = busyBlocks.map(([s,e]) => `${s} to ${e}`).join("\n");
            var content = `Gap: ${Number(slider.value)} minutes<br/><pre>${text}</pre>`;
        } else {
            var content = 'Type the calendar name you want to extract.';
        }
        
        timesContainer.innerHTML = content;
    }
    render();
    d.appendChild(timesContainer);
    const x = document.createElement('button');
    x.innerText = 'close';
    x.addEventListener('click', () => {d.remove()});
    d.appendChild(x);

    slider.addEventListener('change', render);
    slider.addEventListener('mousemove', render);
    calName.addEventListener('keypress', render);
    calName.addEventListener('input', render);
    document.body.insertBefore(d, document.body.firstChild);
    return d;
}
window['drawCalendarExtractorWindow'] = drawCalendarExtractorWindow;
