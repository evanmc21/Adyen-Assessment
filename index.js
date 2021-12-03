require('dotenv').config();
const path = require('path');
const express = require('express');
const { Client, Config, CheckoutAPI } = require('@adyen/api-library');
const { PORT, API_KEY, MERCHANT_ACCOUNT, ENVIRONMENT } = require('./config');

// This is the server-side configuration.  It pulls the information supplied in the .env file to create an instance of the checkout API
const config = new Config();
// Set your X-API-KEY with the API key from the Customer Area.
config.apiKey = API_KEY;
config.merchantAccount = MERCHANT_ACCOUNT;
const client = new Client({ config });
client.setEnvironment(ENVIRONMENT);
const checkout = new CheckoutAPI(client);

const app = express();
app.use(express.json());

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '/public', 'index.html'));
});

app.use(express.static(__dirname + '/public'));


app.post('/getPaymentMethods', (req, res) => {
  const { merchantAccount, countryCode, shopperLocale, amount } = req.body;
  checkout.paymentMethods({
    merchantAccount,
    countryCode,
    shopperLocale,
    amount: {
      currency: amount.currency,
      value: amount.value
    },
    channel: "Web"
  })
    .then(paymentMethodsResponse => res.json(paymentMethodsResponse))
    .catch((err) => {
      res.status(err.statusCode);
      res.json({ message: err.message });
    });
});

app.post('/makePayment', (req, res) => {
  checkout.payments({
    merchantAccount: config.merchantAccount,
    amount: {currency: "EUR", value:1000 },
    reference: "3782",
    paymentMethod: req.body.paymentMethod,
    returnUrl: "http://localhost:8080"
  }).then(response => res.json(response))
    .catch((err)=> {
      res.status(err.statusCode);
      res.json({ message: err.message});
    })
});

app.post('/additionalDetails', async (req, res) => {
  checkout.paymentsDetails({
    details: req.body.details,
    paymentData: req.body.paymentData
  }).then(response => res.json(response))
  .catch((err)=> {
    res.status(err.statusCode);
    res.json({ message: err.message});
  })
})

app.listen(PORT, () => {
  console.log(`Your app is listening on port ${PORT}`);
});
