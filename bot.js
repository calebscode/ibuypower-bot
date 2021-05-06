const puppeteer = require('puppeteer');
const nodemailer = require("nodemailer");
require('dotenv').config();

// Every minute
setInterval(runBot, 1000*60*60);

async function getOrderInfo() {
	const browser = await puppeteer.launch();
	const page = await browser.newPage();

	// Set the size of the page to not clip content
	await page.setViewport({
		width: 1300,
		height: 1300,
		deviceScaleFactor: 1
	});

	// Open the order status page
	await page.goto('https://www.ibuypower.com/support/order-status');

	// Accept the cookies thingy (it gets in the way of the screenshot)	
	await page.click(".notify-confirm");

	// Type in my order number
	await page.type("#order-number", process.env.ORDER_NUMBER);

	// Type in my zipcode
	await page.type("#zipcode", process.env.ZIPCODE);

	// Click submit button
	await page.click("button[type='submit']");

	// Wait for info to load into the page
	await page.waitForSelector(".info");

	await page.screenshot({
		path: 'order-status.png',
		clip: {
			x: 0,
			y: 300,
			width: 1300,
			height: 750
		}
	});

	await browser.close();
}

async function sendImage() {
	const transporter = nodemailer.createTransport({
		service: 'hotmail',
		auth: {
			user: process.env.EMAIL_USER,
			pass: process.env.EMAIL_PASS
		}
	});

	let mailOptions = {
		from: `"🖥️ Daily PC Bot ⚡" <${process.env.EMAIL_USER}>`,
		to: `${process.env.EMAIL_DEST}`,
		subject: "Today's PC Order Check-in!",
		text: "Here are your PC order details for today:",
		html: '<h1>Here are your PC order details for today:</h1><br><br><img src="cid:orderdetails"/>',
		attachments: [{
			filename: 'order-details.png',
			path: './order-status.png',
			cid: 'orderdetails'
		}]
	}

	let info = await transporter.sendMail(mailOptions, (err, info) => {
		if(err) {
			return console.log("Nodemailer error: " + err);
		}
	});
}

async function runBot() {
	console.log("Getting order info from iBUYPOWER.com ...");
	await getOrderInfo(); // generate today's png

	console.log("Screenshot taken! Sending email now ...");
	await sendImage(); // send the image to myself
	
	let today = new Date();
	console.log("Message successfully sent at: " + today);
}