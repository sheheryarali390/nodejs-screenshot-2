
const chromium = require('chrome-aws-lambda');
const aws = require('aws-sdk')
const ejs = require('ejs')
const nodemailer = require('nodemailer')
const htmltoPdf = require('html-pdf');

const ses = new aws.SES({
    region: 'us-east-1'
 })


// const S3Client = require("aws-sdk/clients/s3");
// const s3 = new S3Client({ region: 'us-east-1' });

exports.handler = async (event, context, callback) => {
  let result = 'result';
  let browser;

  try {
    browser = await chromium.puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: false,
      ignoreHTTPSErrors: true,
    });
    const page = await browser.newPage();

    await page.setRequestInterception(true);

    page.on('request', request => {
      if (!request.isNavigationRequest()) {
        request.continue();
        return;
      }
      const headers = request.headers();
      headers['Authorization'] = 'raadsakljdnsadkbhsdab';
      request.continue({ headers });
    });

    await page.goto(event.url,{
        waitUntil: 'networkidle2'
    });

    // 4. Take screenshot
    const screenshot = await page.screenshot({fullPage: true});
    const buffer = Buffer.from(screenshot,'base64')

//     // const result = await s3
//     // .upload({
//     //   Bucket: 'sheheryar-s3',
//     //   Key: `${Date.now()}.png`,
//     //   Body: screenshot,
//     //   ContentType: "image/png",
//     //   ACL: "public-read"
//     // })
//     // .promise();

//   // return the uploaded image url
//   await sendEmail(event.recipientEmail,screenshot)
    const file = await generateTemplate();

    console.log('html generated');
    await sendEmail(
        "This is test subject",
        "<p>This email contails attachment</p>",
        event.recipientEmail,
        { filename: "attachment.html", content: file }
      );

      console.log('end of function');
    return { success: true };

  } catch (error) {
    return callback(error);
  } finally {
    if (browser !== null) {
      //await browser.close();
    }
  }
};


async function generateTemplate() {
    const html = await ejs.renderFile('template.ejs');
    return html;
    // return new Promise((resolve, reject) => {
    //     htmltoPdf.create(html).toBuffer((err, buffer) => {
    //     if (err) {
    //       reject(err);
    //     } else {
    //       resolve(buffer);
    //     }
    //   });
    // });
}

let sendEmail = (subject,html,toAddresses,attachments) => {
    const transporter = nodemailer.createTransport({
        SES: ses
    });

    const mailOptions = {
        from: "sheheryarali@eurustechnologies.com",
        subject,
        html,
        to: toAddresses,
        attachments
  };
  return new Promise((resolve,reject)=>{
    transporter.sendMail(mailOptions, (err, data) => {
      if(err)
      {
        reject(err);
      }
      else {
        console.log('Email sent')
        resolve(data);
      }
    });
  })
  
}