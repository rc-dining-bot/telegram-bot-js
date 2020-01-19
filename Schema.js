const mongoose = require('mongoose');

const { Schema } = mongoose;

const breakfastSchema = new Schema({
  date: String,
  day: String,
  self_service: [String],
  western: [String],
  dim_sum_congee_noodle: [String],
  asian: [String],
  asian_vegetarian: [String],
  malay: [String],
  halal_vegetarian: [String],
  grab_and_go: [String]
});

const dinnerSchema = new Schema({
  date: String,
  day: String,
  self_service: [String],
  western: [String],
  noodle: [String],
  asian: [String],
  vegetarian: [String],
  malay: [String],
  indian: [String],
  soup: [String]
});

const userPrefSchema = new Schema({
  chatId: String,
  hidden: {},
  favorites: [String],
  breakfastNotificationTime: String,
  dinnerNotificationTime: String
});

const Breakfast = mongoose.model('Breakfast', breakfastSchema, 'breakfast');
const Dinner = mongoose.model('Dinner', dinnerSchema, 'dinner');
const UserPref = mongoose.model('Userpref', userPrefSchema);

module.exports = { Breakfast, Dinner, UserPref };
