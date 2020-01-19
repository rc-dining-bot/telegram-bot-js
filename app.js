const TelegramBot = require('node-telegram-bot-api');
const moment = require('moment');
const chrono = require('chrono-node');

const { connectToDatabase } = require('./database.js');
const {
  WELCOME_MSG,
  HELP_MSG,
  NO_MENU_MSG,
  MENU_MSG,
  FAILED_TO_PARSE_DATE_MSG,
  BREAKFAST,
  DINNER,
  DEFAULT_USERPREFS,
  ADDED_FAVORITES_MSG,
  MENU_HAS_FAVORITE_MSG,
  NO_FAVORITES_MSG,
  FAVORITES_MSG,
  START,
  SETTINGS,
  FAVORITE,
  MENU,
  NOTIFICATION,
  HOME,
  HOME_BUTTON_MARKUP
} = require('./const');
const { Breakfast, Dinner, UserPref } = require('./Schema');
const { bold, capitalize, parseMenu, parseCallback, cleanUnderscore } = require('./util');
require('dotenv').config();

// Telegram bot token
const token = process.env.TOKEN;

// Mongodb connection
connectToDatabase();

// Starts the telegram bot
const bot = new TelegramBot(token, { polling: true, onlyFirstMatch: true });

function start(msg) {
  // Chat ID from the user
  const chatId = msg.chat.id;
  const userFirstName = msg.chat.first_name;

  const resp = WELCOME_MSG(userFirstName);

  bot.sendMessage(chatId, resp).catch(console.log);
}

function help(msg) {
  const chatId = msg.chat.id;

  bot.sendMessage(chatId, HELP_MSG).catch(console.log);
}

async function getUserPref(chatId) {
  let userPref = await UserPref.findOne({ chatId });
  if (userPref === undefined || userPref === null) {
    const defSettings = new UserPref({
      chatId,
      ...DEFAULT_USERPREFS
    });
    userPref = defSettings;
    await userPref.save();
  }
  return userPref;
}

function getMenuQueryDate(enteredDate) {
  // No date entered, default to today
  if (enteredDate === undefined) {
    return moment(new Date());
  }

  // Try parsing the entered string into Date
  const parsedNaturalDate = chrono.parseDate(enteredDate);
  // Throw and error if parsing failed
  if (parsedNaturalDate === null) {
    throw Error(FAILED_TO_PARSE_DATE_MSG(enteredDate));
  }
  return moment(parsedNaturalDate);
}

function getMenu(meal) {
  return async (msg, match) => {
    const chatId = msg.chat.id;
    const enteredDate = match[1];
    let queryDate;
    try {
      queryDate = getMenuQueryDate(enteredDate);
    } catch (e) {
      await bot.sendMessage(chatId, e.message);
      return;
    }

    const queryDateString = queryDate.format('YYMMDD');

    let data;
    switch (meal) {
      case BREAKFAST:
        data = await Breakfast.findOne({ date: queryDateString });
        break;
      case DINNER:
        data = await Dinner.findOne({ date: queryDateString });
        break;
      default:
        console.error(`Invalid meal detected: ${meal}`);
        data = null;
    }
    if (data === null) {
      await bot.sendMessage(chatId, NO_MENU_MSG(meal), { parse_mode: '' });
      return;
    }

    const userPref = await getUserPref(chatId);
    const hiddenFood = userPref.hidden;
    const menu = parseMenu(data.toObject(), hiddenFood);

    const message = MENU_MSG(queryDate.format('dddd, DD MMM YYYY'), bold(capitalize(meal)), menu);
    await bot.sendMessage(chatId, message, HOME_BUTTON_MARKUP).catch(console.log);

    for (const fav of userPref.favorites) {
      if (message.includes(fav)) {
        bot.sendMessage(chatId, MENU_HAS_FAVORITE_MSG(fav));
      }
    }
  };
}

async function settings(msg) {
  const chatId = msg.chat.id;

  const setting = 'Hi, here is the menu for settings:\n';
  bot
    .sendMessage(chatId, setting, {
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Toggle Menu Visibility', callback_data: 'settings.menu' }],
          [{ text: 'View Favourite Foods', callback_data: 'settings.favorite' }],
          [{ text: 'View Notification Settings', callback_data: 'settings.notification' }],
          [{ text: 'Back to start', callback_data: 'start.home' }]
        ]
      }
    })
    .catch(console.log);
}

function markup(pref) {
  const hid = pref.hidden;
  return {
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [
          { text: `${hid.self_service ? '❌' : '✅'}Self Service`, callback_data: 'menu.self_service' },
          { text: `${hid.western ? '❌' : '✅'}Western`, callback_data: 'menu.western' }
        ],
        [
          {
            text: `${hid.dim_sum_congee_noodle ? '❌' : '✅'}Dim Sum Congee Noodle`,
            callback_data: 'menu.dim_sum_congee_noodle'
          },
          { text: `${hid.asian ? '❌' : '✅'}Asian`, callback_data: 'menu.asian' }
        ],
        [
          { text: `${hid.asian_vegetarian ? '❌' : '✅'}Asian Vegetarian`, callback_data: 'menu.asian_vegetarian' },
          { text: `${hid.malay ? '❌' : '✅'}Malay`, callback_data: 'menu.malay' }
        ],
        [
          { text: `${hid.halal_vegetarian ? '❌' : '✅'}Halal Vegetarian`, callback_data: 'menu.halal_vegetarian' },
          { text: `${hid.grab_and_go ? '❌' : '✅'}Grab and Go`, callback_data: 'menu.grab_and_go' }
        ],
        [
          { text: `${hid.noodle ? '❌' : '✅'}Noodle`, callback_data: 'menu.noodle' },
          { text: `${hid.vegetarian ? '❌' : '✅'}Vegetarian`, callback_data: 'menu.vegetarian' }
        ],
        [
          { text: `${hid.soup ? '❌' : '✅'}Soup`, callback_data: 'menu.soup' },
          { text: `${hid.indian ? '❌' : '✅'}Indian`, callback_data: 'menu.indian' }
        ],
        [
          { text: 'Settings', callback_data: 'settings.home' },
        ]
      ]
    }
  };
}

function hideCuisine(msg, pref) {
  let hidden = '';
  const hiddenKeys = [];
  for (const [item, hid] of Object.entries(pref.hidden)) {
    if (hid) {
      hiddenKeys.push(capitalize(cleanUnderscore(item.toLowerCase())));
    }
  }

  hidden = hiddenKeys.join(', ');

  if (hidden === '') {
    return 'You do not have any hidden cuisine.';
  }
  const message = `Hi, ${msg.chat.first_name}, you hid the following cuisines\n${hidden}`;

  return message;
}

async function addFavorite(msg, match) {
  const chatId = msg.chat.id;
  let newFood = match[1];

  if (!newFood) {
    bot.sendMessage(chatId, "You didn't specify a favorite food!", HOME_BUTTON_MARKUP);
    return;
  }

  newFood = capitalize(newFood.trim());

  let userPrefs = await UserPref.findOne({ chatId });
  if (userPrefs == null) {
    userPrefs = new UserPref({ chatId, ...DEFAULT_USERPREFS });
  }

  if (userPrefs.favorites.includes(newFood)) {
    bot.sendMessage(chatId, `You already favorited ${newFood}`, HOME_BUTTON_MARKUP);
    return;
  }

  userPrefs.favorites.push(newFood);
  await userPrefs.save();

  bot
    .sendMessage(chatId, ADDED_FAVORITES_MSG(userPrefs.favorites.join(', ')), HOME_BUTTON_MARKUP)
    .catch(console.log);
}

async function removeFavorite(msg) {
  const chatId = msg.chat.id;

  const inlineButtons = [];

  let userPrefs = await UserPref.findOne({ chatId });

  if (userPrefs === null) {
    userPrefs = new UserPref({ chatId, ...DEFAULT_USERPREFS });
  }

  for (const fav of userPrefs.favorites) {
    const button = {
      text: fav,
      callback_data: `${FAVORITE}.${fav}`
    };
    if (inlineButtons.length > 0 && inlineButtons[inlineButtons.length - 1].length === 1) {
      inlineButtons[inlineButtons.length - 1].push(button);
    } else {
      inlineButtons.push([button]);
    }
  }

  if (inlineButtons.length === 0) {
    bot.sendMessage(chatId, NO_FAVORITES_MSG, HOME_BUTTON_MARKUP);
    return;
  } else {
    inlineButtons.push([{
      text: 'Back to start',
      callback_data: 'start.home'
    }])
  }

  const opts = {
    reply_markup: {
      inline_keyboard: inlineButtons
    }
  };

  bot.sendMessage(chatId, 'Select your favorite food to remove:', opts);
}

async function displayNotificationSettings(msg, prefs) {
  const chatId = msg.chat.id;
  const setting =
    "Hi, here're your notification settings:\n" +
    `Breakfast notification time: ${prefs.breakfastNotificationTime || 'Not set'}\n` +
    `Dinner notification time: ${prefs.dinnerNotificationTime || 'Not set'}`;

  bot.sendMessage(chatId, setting, HOME_BUTTON_MARKUP).catch(console.log);
}

function setMealNotificationTime(meal) {
  return async (msg, match) => {
    const chatId = msg.chat.id;
    const enteredTime = match[1];
    if (enteredTime === undefined) {
      await bot.sendMessage(chatId, 'Please specify a notification time in the format of HH:MM');
      return;
    }

    const parsedNotificationTime = moment(enteredTime.trim(), 'HH:mm', true);
    const notificationTimeString = parsedNotificationTime.format('HH:mm');
    if (notificationTimeString === 'Invalid date') {
      await bot.sendMessage(chatId, 'The time you have entered does not seem to be in the right format (HH:MM)');
      return;
    }

    let userPrefs = await UserPref.findOne({ chatId });
    if (userPrefs == null) {
      userPrefs = new UserPref({ chatId, ...DEFAULT_USERPREFS });
    }

    switch (meal) {
      case BREAKFAST:
        userPrefs.breakfastNotificationTime = notificationTimeString;
        break;
      case DINNER:
        userPrefs.dinnerNotificationTime = notificationTimeString;
        break;
      default:
        console.error(`Invalid meal detected: ${meal}`);
        await bot.sendMessage(chatId, 'Sorry, something went wrong');
        return;
    }
    await userPrefs.save();

    await bot
      .sendMessage(chatId,
        `Your ${meal} notification time has been changed to ${notificationTimeString}`,
        HOME_BUTTON_MARKUP)
      .catch(console.log);
  };
}

bot.onText(/\/start/, start);

bot.onText(/\/help/, help);

bot.onText(/\/breakfast( .*)?/, getMenu(BREAKFAST));

bot.onText(/\/dinner( .*)?/, getMenu(DINNER));

bot.onText(/\/settings/, settings);

bot.onText(/\/add_favorite( .*)?/, addFavorite);

bot.onText(/\/remove_favorite/, removeFavorite);

// callbacks
async function handleMenu(message, data) {
  const chatId = message.chat.id;
  const pref = await getUserPref(chatId);
  pref.hidden[data] = !pref.hidden[data];
  await UserPref.updateOne({ chatId }, pref);

  const markupWithPref = markup(pref);

  bot.sendMessage(chatId, hideCuisine(message, pref), markupWithPref);
}

async function handleFavorites(message, data) {
  const chatId = message.chat.id;
  const userPrefs = await UserPref.findOne({ chatId });

  if (!userPrefs.favorites.includes(data)) {
    bot.sendMessage(chatId, 'You already removed that!', HOME_BUTTON_MARKUP);
    return;
  }

  userPrefs.favorites = userPrefs.favorites.filter(fav => fav !== data);

  userPrefs.save().catch(console.log);

  let msg = '';

  if (userPrefs.favorites.length === 0) {
    msg = NO_FAVORITES_MSG;
  } else {
    msg = `Your favorite foods are now: \n${userPrefs.favorites.join(', ')}`;
  }

  bot.sendMessage(chatId, msg, HOME_BUTTON_MARKUP);
}

async function handleSettings(msg, data) {
  const chatId = msg.chat.id;
  const pref = await getUserPref(chatId);
  switch (data) {
    case MENU:
      bot.sendMessage(chatId, hideCuisine(msg, pref), markup(pref));
      break;
    case FAVORITE:
      bot.sendMessage(chatId, FAVORITES_MSG(pref.favorites.join(', ')), HOME_BUTTON_MARKUP);
      break;
    case NOTIFICATION:
      displayNotificationSettings(msg, pref);
      break;
    case HOME:
      settings(msg);
    default:
      console.error('Invalid');
  }
}

bot.on('callback_query', async query => {
  const [type, data] = parseCallback(query.data);
  switch (type) {
    case START:
      await start(query.message);
      break;
    case SETTINGS:
      await handleSettings(query.message, data);
      break;
    case FAVORITE:
      await handleFavorites(query.message, data);
      break;
    case MENU:
      await handleMenu(query.message, data);
      break;
    default:
  }
});

bot.onText(/\/set_breakfast_time( .*)?/, setMealNotificationTime(BREAKFAST));

bot.onText(/\/set_dinner_time( .*)?/, setMealNotificationTime(DINNER));

bot.onText(/.+/, msg => bot.sendMessage(msg.chat.id, 'Sorry I did not understand that.'));
