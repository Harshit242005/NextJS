// api/finishTask.js

const nodemailer = require('nodemailer');

const taskFinish = (invitedUser, projectName, taskid) => {
    return new Promise((resolve, reject) => {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'agreharshit610@gmail.com',
                pass: 'nzgj amef lhwx jcgt'
            }
        });

        const mailOptions = {
            from: 'agreharshit610@gmail.com',
            to: invitedUser,
            subject: 'Project task is completed',
            text: `${projectName} Task has been completed. Task id is:\n\n${taskid}`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending email:', error);
                reject(false);
            } else {
                console.log('Email sent:', info.response);
                resolve(true);
            }
        });
    });
};

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const { assigniesIdEmails, projectName, taskId } = req.body;

        try {
            for (const email of assigniesIdEmails) {
                await taskFinish(email, projectName, taskId);
            }
            res.status(200).send('Emails sent successfully');
        } catch (error) {
            res.status(500).send('Error in updating the users about finishing the task');
        }
    } else {
        res.status(405).send('Method Not Allowed');
    }
}
