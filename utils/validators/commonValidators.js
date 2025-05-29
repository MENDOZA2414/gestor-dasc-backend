// utils/validators/commonValidators.js

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^\d{10}$/;
const controlNumberRegex = /^\d{10}$/; 
const nameRegex = /^[A-Za-zÁÉÍÓÚÑáéíóúñ\s]+$/;
const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[\W_]).{8,}$/;

function isValidEmail(email) {
  return emailRegex.test(email);
}

function isValidPhone(phone) {
  return phoneRegex.test(phone);
}

function isValidName(name) {
  return nameRegex.test(name);
}

function isValidPassword(password) {
  return passwordRegex.test(password);
}

function isValidControlNumber(cn) {
  return controlNumberRegex.test(cn);
}

module.exports = {
  isValidEmail,
  isValidPhone,
  isValidName,
  isValidPassword,
  isValidControlNumber,
  regex: {
    email: emailRegex,
    phone: phoneRegex,
    name: nameRegex,
    password: passwordRegex,
    controlNumber: controlNumberRegex
  }
};
