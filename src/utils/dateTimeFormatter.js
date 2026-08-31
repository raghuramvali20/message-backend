const WEEKDAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const normalizeToDate = (dateValue) => {
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) {
        return null;
    }
    return date;
};

const buildDisplayDate = (dateValue, now = new Date()) => {
    const parsedDate = normalizeToDate(dateValue);
    if (!parsedDate) {
        return {
            formattedTime: '',
            formattedDate: '',
            dateGroup: '',
            displayLabel: ''
        };
    }

    const localDate = new Date(parsedDate);
    const currentDate = new Date(now);
    const today = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
    const targetDay = new Date(localDate.getFullYear(), localDate.getMonth(), localDate.getDate());
    const diffInDays = Math.round((today - targetDay) / 86400000);

    let formattedDate;
    if (diffInDays === 0) {
        formattedDate = 'Today';
    } else if (diffInDays === 1) {
        formattedDate = 'Yesterday';
    } else if (diffInDays < 7) {
        const weekdayIndex = (localDate.getDay() + 6) % 7;
        formattedDate = WEEKDAY_NAMES[weekdayIndex];
    } else if (localDate.getFullYear() === currentDate.getFullYear()) {
        formattedDate = `${localDate.getDate()} ${MONTH_NAMES[localDate.getMonth()]}`;
    } else {
        formattedDate = `${localDate.getDate()} ${MONTH_NAMES[localDate.getMonth()]} ${localDate.getFullYear()}`;
    }

    const formattedTime = `${localDate.getHours()}:${String(localDate.getMinutes()).padStart(2, '0')}`;
    const dateGroup = `${localDate.getFullYear()}-${String(localDate.getMonth() + 1).padStart(2, '0')}-${String(localDate.getDate()).padStart(2, '0')}`;

    return {
        formattedTime,
        formattedDate,
        dateGroup,
        displayLabel: formattedDate
    };
};

const enrichMessagePayload = (message, now = new Date()) => {
    if (!message) {
        return message;
    }

    const displayInfo = buildDisplayDate(message.time || message.lastUpdate, now);

    return {
        ...message,
        ...displayInfo
    };
};

module.exports = {
    buildDisplayDate,
    enrichMessagePayload
};
