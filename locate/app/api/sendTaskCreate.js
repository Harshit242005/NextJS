// api/sendTaskCreate.js

const nodemailer = require('nodemailer');

const createTask = (invitedUser, invitedData) => {
    return new Promise((resolve, reject) => {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'agreharshit610@gmail.com',
                pass: 'nzgj amef lhwx jcgt'
            }
        });

        const mailOptions = {
            from: invitedUser,
            to: invitedUser,
            subject: 'New Task Assigned',
            text: `You have been assigned with a new task. \n
            ${invitedData.Heading}, created by ${invitedData.CreatedBy} at ${invitedData.CreatedAt} and the deadline for this task is ${invitedData.Deadline}`
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
        const { Heading, Deadline, CreatedAt, CreatedBy, Members } = req.body;
        const taskData = {
            Heading,
            Deadline,
            CreatedAt,
            CreatedBy
        };

        try {
            for (const member of Members) {
                await createTask(member, taskData);
            }
            res.status(200).send('Task creation notifications sent successfully');
        } catch (error) {
            res.status(500).send('Failed to send task creation notifications');
        }
    } else {
        res.status(405).send('Method Not Allowed');
    }
}
