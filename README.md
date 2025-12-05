# Extra Class Lessons App

This project is a Vue.js application that allows users to browse lessons, add them to a cart, and complete an order. It includes searching, sorting, cart management, form validation, and communication with a backend API.

## Features
- Load lessons from the backend API
- Search lessons by subject, location, price, or spaces
- Sort lessons by subject, location, price, or spaces
- Add lessons to the cart (spaces decrease automatically)
- Remove lessons from the cart (spaces increase back)
- Checkout form with name and phone validation
- Submit orders to the backend

## How to Run
1. Install dependencies:
   npm install

2. Start the development server:
   npm run serve

3. Build the production version:
   npm run build

## API Endpoints
GET /lessons - returns all lessons  
POST /orders - sends the order information

## Validation
- Name must contain letters and spaces only
- Phone must contain numbers only
- Checkout button is enabled only when the form is valid and cart is not empty

## Configuration
Set your API link in your Vue app using:
this.$api

## Project Contents
- App.vue: main application file
- main.js: app entry point
- public/index.html: main HTML file
