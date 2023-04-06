import { Router } from "express";
import Imap from 'node-imap';
import { simpleParser } from 'mailparser';
import dotenv from 'dotenv';
dotenv.config();

const router = Router();

const inspect = (text) => {
    
    // console.log(util.inspect(text, false, null, true))
}

let paramsFilteredMails = []


// create an IMAP connection object
const imap = new Imap({
    user:process.env.USERNAME,
    password:process.env.PASSWORD,
    host:process.env.HOST,
    port: process.env.PORT_CORREO,
    tls: true,
    tlsOptions: { rejectUnauthorized: false }
});




function openInbox(cb) {
    imap.openBox('INBOX', true, cb);
}

// function openSent(cb) {
//     imap.openBox('INBOX.Sent', false, cb);
//   }

//Fetch a solo los mails de entrada
async function fetchAllEmails() {
    return new Promise((resolve, reject) => {
        imap.once('ready', function () {
            openInbox(function (err, box) {
                if (err) reject(err);

                imap.search(['ALL'], function (err, results) {
                    if (err) reject(err);

                    var f = imap.fetch(results, { bodies: '', envelope: true });

                    var messages = [];

                    f.on('message', function (msg, seqno) {

                        var message = {};
                        var attachments = [];

                        const emailPromise = new Promise((resolve, reject) => {
                            let buffer = '';

                            msg.on('body', function (stream, info) {
                                stream.on('data', function (chunk) {
                                    buffer += chunk.toString('utf8');
                                });

                                stream.on('end', async function () {
                                    const email = await simpleParser(buffer);
                                    resolve(email.textAsHtml);
                                });
                            });
                        });

                        const attributesPromise = new Promise((resolve, reject) => {
                            msg.once('attributes', function (attrs) {
                                
                                message.flags = attrs.flags;
                                message.time = new Date(attrs.envelope.date).toString();
                                message.subject = attrs.envelope.subject;
                                message.from = attrs.envelope.sender[0];
                                message.to = attrs.envelope.to[0];
                                message.cc = attrs.envelope.cc || [];
                                message.bcc = attrs.envelope.bcc || [];
                                message.replies = [];
                                message.id = attrs.uid;
                                message.isRead = attrs.flags.includes('\\Seen');
                                message.isStarred = attrs.flags.includes('\\Flagged');
                                message.labels = [];
                                message.folder = box.name.toLowerCase();
                                message.hasNextMail = seqno < results.length ? true : false;
                                message.hasPreviousMail = seqno > 1 ? true : false;

                                resolve();
                            });
                        });

                        Promise.all([emailPromise, attributesPromise]).then(([messageText]) => {
                            message.message = messageText;
                            message.attachments = attachments;
                            messages.push(message);

                            if (messages.length === results.length) {
                                const totalMessages = messages.length;
                                const draftMessages = messages.filter(msg => msg.flags.includes('\\Draft')).length;
                                const spamMessages = messages.filter(msg => msg.flags.includes('\\Junk') || msg.flags.includes('\\Spam')).length;

                                const emailsMeta = { total: totalMessages, draft: draftMessages, spam: spamMessages };

                                resolve({ emails: messages });
                            }
                        });

                    });

                    f.once('error', function (err) {
                        
                        imap.end();
                        reject(err);
                    });

                    f.once('end', function () {
                        
                        imap.end();
                    });
                });
            });
        });
        imap.connect();
    });
}



// // Función para obtener los correos enviados
// async function fetchAllEmails() {
//     return new Promise((resolve, reject) => {
//       imap.once('ready', function() {
//         imap.getBoxes(function(err, boxes) {
//           if (err) {
//             reject(err);
//             return;
//           }
  
//           const mailboxes = boxes.INBOX.children;
  
//           const mailboxPromises = Object.keys(mailboxes).map(mailbox => {
//             return new Promise((resolve, reject) => {
//               const path = `INBOX.${mailbox}`;
  
//               imap.openBox(path, false, function (err, box) {
//                 if (err) {
//                   console.log(`Error opening ${path} mailbox`, err);
//                   reject(err);
//                   return;
//                 }
  
//                 imap.search(['ALL'], function (err, results) {
//                   if (err) {
//                     console.log(`Error searching ${path} mailbox`, err);
//                     reject(err);
//                     return;
//                   }
  
//                   const f = imap.fetch(results, { bodies: '', envelope: true });
  
//                   const messages = [];
  
//                   f.on('message', function (msg, seqno) {
//                     const message = {};
//                     const attachments = [];
  
//                     const emailPromise = new Promise((resolve, reject) => {
//                       let buffer = '';
  
//                       msg.on('body', function (stream, info) {
//                         stream.on('data', function (chunk) {
//                           buffer += chunk.toString('utf8');
//                         });
  
//                         stream.on('end', async function () {
//                           const email = await simpleParser(buffer);
//                           resolve(email.textAsHtml);
//                         });
//                       });
//                     });
  
//                     const attributesPromise = new Promise((resolve, reject) => {
//                       msg.once('attributes', function (attrs) {
//                         message.flags = attrs.flags;
//                         message.time = new Date(attrs.envelope.date).toString();
//                         message.subject = attrs.envelope.subject;
//                         message.from = attrs.envelope.from[0];
//                         message.to = attrs.envelope.to || [];
//                         message.cc = attrs.envelope.cc || [];
//                         message.bcc = attrs.envelope.bcc || [];
//                         message.replies = [];
//                         message.id = attrs.uid;
//                         message.isRead = attrs.flags.includes('\\Seen');
//                         message.isStarred = attrs.flags.includes('\\Flagged');
//                         message.labels = [];
//                         message.folder = mailbox;
  
//                         resolve();
//                       });
//                     });
  
//                     Promise.all([emailPromise, attributesPromise]).then(([messageText]) => {
//                       message.message = messageText;
//                       message.attachments = attachments;
//                       messages.push(message);
  
//                       if (messages.length === results.length) {
//                         const totalMessages = messages.length;
//                         const draftMessages = messages.filter(msg => msg.flags.includes('\\Draft')).length;
//                         const spamMessages = messages.filter(msg => msg.flags.includes('\\Junk') || msg.flags.includes('\\Spam')).length;
  
//                         const emailsMeta = { total: totalMessages, draft: draftMessages, spam: spamMessages };
  
//                         resolve({ emails: messages });
//                       }
//                     });
//                   });
  
//                   f.once('error', function (err) {
//                     console.log(`Fetch error on ${path} mailbox:`, err);
//                     imap.end();
//                     reject(err);
//                   });
  
//                   f.once('end', function () {
//                     console.log(`Done fetching all messages on ${path} mailbox!`);
//                     imap.end();
//                   });
//                 });
//               });
//             });
//           });
  
//           Promise.all(mailboxPromises)
//   .then(mailboxes => {
//     const allEmails = mailboxes.reduce((emails, mailbox) => {
//       return {
//         ...emails,
//         ...mailbox.emails.reduce((mailboxEmails, email) => ({
//           ...mailboxEmails,
//           [email.id]: email
//         }), {})
//       };
//     }, {});

//     resolve(allEmails);
//   })
//   .catch(err => {
//     console.log('Error fetching all emails:', err);
//     reject(err);
//   });

             
  
      
//       imap.once('error', function(err) {
//         console.log('IMAP error:', err);
//         reject(err);
//       });
      
//       imap.once('end', function() {
//         console.log('Connection ended');
//       });
      
//       imap.connect();
//     });

// }      

//Saber que buzones tenemos
// imap.once('ready', function() {
//     imap.getBoxes(function(err, boxes) {
//       if (err) throw err;
//       console.log(boxes.INBOX.children);
//       imap.end();
//     });
//   });
  
//   imap.connect();





//Traer todos los Emails
router.get('/allemails', async (req, res) => {
    try {
        const result = await fetchAllEmails();
        console.log(result)
        res.json(result);
    } catch (err) {
        res.status(500).send('Error fetching emails');
    }
});

router.get('/emails', async (req, res) => {
    try {
        const { q = '', folder = 'inbox', label } = req.query;
        const queryLowered = q.toLowerCase();

        const data = await fetchEmails();

        function isInFolder(email) {
            if (folder === 'trash') return email.folder === 'trash';
            if (folder === 'starred') return email.isStarred && email.folder !== 'trash';
            return email.folder === (folder || email.folder) && email.folder !== 'trash';
        }

        const filteredData = data.emails.filter(
            email =>
                (email.from.name.toLowerCase().includes(queryLowered) ||
                    email.subject.toLowerCase().includes(queryLowered) ||
                    email.message.toLowerCase().includes(queryLowered)) &&
                isInFolder(email) &&
                (label ? email.labels.includes(label) : true)
        )
        paramsFilteredMails = filteredData

        // ------------------------------------------------
        // Email Meta
        // ------------------------------------------------
        const emailsMeta = {
            inbox: data.emails.filter(email => !email.isRead && email.folder === 'inbox').length,
            draft: data.emails.filter(email => email.folder === 'draft').length,
            spam: data.emails.filter(email => !email.isRead && email.folder === 'spam').length
        }

        res.status(200).json({
            emails: filteredData,
            emailsMeta
        });
    } catch (err) {
        res.status(500).send('Error fetching emails');
    }
});



// Obtener un email por ID
router.get('/getemail', (req, res) => {
   
    const { id } = req.query;
    const emailId = Number(id);
    const mail = paramsFilteredMails.find(i => i.id === emailId);


    if (mail) {
        const mailIndex = paramsFilteredMails.findIndex(i => i.id === mail.id);
        mailIndex > 0 ? (mail.hasPreviousMail = true) : (mail.hasPreviousMail = false);
        mailIndex < paramsFilteredMails.length - 1 ? (mail.hasNextMail = true) : (mail.hasNextMail = false);
    }

    if (mail) {
        res.status(200).json(mail);
    } else {
        res.sendStatus(404);
    }
});



//Traer mails
router.post('/update', async (req, res) => {
    try {
        const { emailIds, dataToUpdate } = req.body.data

        const data = await fetchEmails();
        function updateMailData(email) {
            Object.assign(email, dataToUpdate)
        }

        data.emails.forEach(email => {
            if (emailIds.includes(email.id)) updateMailData(email)
        })

        // Enviar una respuesta de éxito con el código de estado HTTP 200
        res.sendStatus(200)
    } catch (error) {
      
        res.status(500).json({ error: 'Internal Server Error' });
    }
})



router.post('/apps/email/update-emails-label', async (req, res) => {
    try {
        const { emailIds, label } = req.body.data;
        const data = await fetchEmails();

     
        function updateMailLabels(email) {
            const labelIndex = email.labels.indexOf(label);
            if (labelIndex === -1) email.labels.push(label);
            else email.labels.splice(labelIndex, 1);
        }
        data.emails.forEach(email => {
            if (emailIds.includes(email.id)) updateMailLabels(email);
        });

        res.status(200).send('Email labels updated successfully.');
    } catch (error) {
        
        res.status(500).json({ error: 'Internal Server Error' });
    }
});




router.get('/paginate-email', (req, res) => {
    try {
        const { dir, emailId } = req.query;
       
        const currentEmailIndex = paramsFilteredMails.findIndex(e => e.id === parseInt(emailId));
        const newEmailIndex = dir === 'previous' ? currentEmailIndex - 1 : currentEmailIndex + 1;
        const newEmail = paramsFilteredMails[newEmailIndex];
        if (newEmail) {
            const mailIndex = paramsFilteredMails.findIndex(i => i.id === newEmail.id);
            mailIndex > 0 ? (newEmail.hasPreviousMail = true) : (newEmail.hasPreviousMail = false);
            mailIndex < paramsFilteredMails.length - 1 ? (newEmail.hasNextMail = true) : (newEmail.hasNextMail = false);
        }

        return newEmail ? res.status(200).json(newEmail) : res.status(404).send('Email not found');
    } catch (error) {
        
        res.status(500).json({ error: 'Internal Server Error' });
    }
});










export default router;
