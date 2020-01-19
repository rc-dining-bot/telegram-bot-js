const BREAKFAST = 'breakfast';
const BREAKFAST_COMMAND = `/${BREAKFAST}`;
const BREAKFAST_DESC = `${BREAKFAST_COMMAND} - view today's breakfast menu\n`;
const DINNER = 'dinner';
const DINNER_COMMAND = `/${DINNER}`;
const DINNER_DESC = `${DINNER_COMMAND} - view today's dinner menu\n`;
const SETTINGS = 'settings';
const SETTINGS_COMMAND = `/${SETTINGS}`;
const SETTINGS_DESC = `${SETTINGS_COMMAND} - customize menu visibility and display settings\n`;
const ADD_FAVORITE_COMMAND = '/add_favorite';
const ADD_FAVORITE_DESC = `${ADD_FAVORITE_COMMAND} <food> - add favorite food for notifications\n`;
const REMOVE_FAVORITE_COMMAND = '/remove_favorite';
const REMOVE_FAVORITE_DESC = `${REMOVE_FAVORITE_COMMAND} - remove favorite food from notifications\n`;
const NO_FAVORITES_MSG = `You have no favorite foods! Use ${ADD_FAVORITE_COMMAND} <food> to add one!`;
const HELP_COMMAND = '/help';
const HELP_DESC = `${HELP_COMMAND} - show the help message\n`;
const SET_BREAKFAST_NOTIFICATION_COMMAND = '/set_breakfast_time';
const SET_BREAKFAST_NOTIFICATION_DESC = `${SET_BREAKFAST_NOTIFICATION_COMMAND} - set breakfast notification time (HH:MM). Notifications after 09:30 will be for the next day's breakfast\n`;
const SET_DINNER_NOTIFICATION_COMMAND = '/set_dinner_time';
const SET_DINNER_NOTIFICATION_DESC = `${SET_DINNER_NOTIFICATION_COMMAND} - set dinner notification time (HH:MM). Notifications after 21:30 will be for the next day's dinner\n`;

const COMMAND_LIST =
  `${BREAKFAST_DESC}${DINNER_DESC}` +
  `${ADD_FAVORITE_DESC}${REMOVE_FAVORITE_DESC}${SET_BREAKFAST_NOTIFICATION_DESC}` +
  `${SET_DINNER_NOTIFICATION_DESC}${SETTINGS_DESC}${HELP_DESC}\n` +
  '/breakfast (or /dinner) <day> - view the breakfast/dinner menu for a particular day\n' +
  'e.g. /breakfast tomorrow, /breakfast saturday, /dinner next tuesday\n\nGive feedback for the bot at https://github.com/rc-dining-bot/telegram-bot';
const WELCOME_MSG = userFirstName =>
  `Hello, ${userFirstName}! Welcome! To get started, enter one of the following commands:\n\n${COMMAND_LIST}`;
const HELP_MSG = `Hello, these are RC Dining Bot's commands:\n${COMMAND_LIST}`;
const NO_MENU_MSG = meal => `Sorry, OHS does not have a ${meal} menu for this day.`;
const MENU_MSG = (date, meal, menu) => `${meal} - ${date}\n\n${menu}`;
const FAILED_TO_PARSE_DATE_MSG = enteredDate => `Sorry, I don't understand the date ${enteredDate} :(`;
const FAVORITES_MSG = favorites => `These are your current favorites:\n${favorites}`;
const ADDED_FAVORITES_MSG = favorites => `You have updated your favorites. ${FAVORITES_MSG(favorites)}`;
const MENU_HAS_FAVORITE_MSG = favorite => `Hey! This meal contains ${favorite}`;
const MENU = 'menu';
const START = 'start';
const FAVORITE = 'favorite';
const NOTIFICATION = 'notification';
const HOME = 'home';

const DEFAULT_USERPREFS = {
  hidden: {
    self_service: false,
    western: false,
    dim_sum_congee_noodle: false,
    asian: false,
    asian_vegetarian: false,
    malay: false,
    halal_vegetarian: false,
    grab_and_go: false,
    noodle: false,
    vegetarian: false,
    soup: false,
    indian: false
  },
  favorites: [],
  breakfastNotificationTime: '23:00',
  dinnerNotificationTime: '16:00'
};

const HOME_BUTTON_MARKUP = {
  parse_mode: 'HTML',
  reply_markup: {
    inline_keyboard: [
      [{ text : "Back to start", callback_data: "start.home"}]
    ]
  }
}

module.exports = {
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
  SETTINGS,
  START,
  MENU,
  FAVORITE,
  NOTIFICATION,
  HOME,
  HOME_BUTTON_MARKUP
};
