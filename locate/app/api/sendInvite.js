// api/sendInvite.js

const nodemailer = require('nodemailer');

const inviteEmail = (invitedUser, invitedUrl) => {
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
            subject: 'Invitation to join project',
            text: `You have been invited to join a project. Click on the link below to accept the invitation:\n\n${invitedUrl}`
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
        const { inviteTo, UniqueUrl } = req.body;

        try {
            const response = await inviteEmail(inviteTo, UniqueUrl);
            if (response) {
                res.status(200).send('Invitation sent successfully');
            } else {
                res.status(500).send('Failed to send invitation');
            }
        } catch (error) {
            res.status(500).send('Error occurred');
        }
    } else {
        res.status(405).send('Method Not Allowed');
    }
}
