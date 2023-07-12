import express from 'express';
import Imap from 'node-imap';
import dotenv from 'dotenv';
import fs from "fs";

import pkg from 'base64-stream';
import Base64Stream from 'base64-stream';
const { Base64 } = pkg;





dotenv.config();

const router = express.Router();

let paramsFilteredMails = []

let data = {
  emails: []
};

const transformToEmailsObject = (data) => {
  const emails = [];

  for (const key in data) {
    if (Object.hasOwnProperty.call(data, key)) {
      const emailData = data[key];
      
      const email = {
        id: parseInt(key),
        from: {
          email: emailData.header.from[0],
          name: emailData.header.from[0],
          avatar: '/images/avatars/1.png',
        },
        to: emailData.header.to.map((to) => ({ name: to, email: to })),
        subject: emailData.header.subject,
        cc: [],
        bcc: [],
        message: emailData.cuerpo.body,
        attachments: [],
        isStarred: emailData.isStarred || false,
        labels: [],
        time: emailData.fecha.date.toString(),
        replies: [],
        folder: emailData.cuerpo.mailbox.toLowerCase(),
        isRead: emailData.isRead,
        hasReplies: emailData.hasReplies || false,
        hasAttachments: emailData.hasAttachments || null,
      };

      emails.push(email);
  //  console.log(emails)
    }
  }

  return emails;
};

const inspect = (text) => {
  console.log(text);
  // console.log(util.inspect(text, false, null, true))
};

const imapConfig = {
  user: process.env.USERNAME,
  password: process.env.PASSWORD,
  host: process.env.HOST,
  port: process.env.PORT_CORREO,
  tls: true,
  connTimeout: 10000, // Default by node-imap 
  authTimeout: 5000, // Default by node-imap, 

  tlsOptions: { rejectUnauthorized: false },
  mailbox: "INBOX", // mailbox to monitor 
  searchFilter: ["UNSEEN", "FLAGGED"], // the search filter being used after an IDLE notification has been retrieved 
  markSeen: true, // all fetched email willbe marked as seen and not fetched next time 
  fetchUnreadOnStart: true, // use it only if you want to get all unread email on lib start. Default is `false`, 
  mailParserOptions: { streamAttachments: true }, // options to be passed to mailParser lib. 
  attachments: true, // download attachments as they are encountered to the project directory 
  attachmentOptions: { directory: "attachments/" } // specify a download directory for attachments 
}

const imap = new Imap(imapConfig);

const mailboxNames = ['INBOX', 'Archive', 'Junk', 'Drafts', 'Sent', 'Trash', 'spam'];

let header = {};
let cuerpo = {};
let fecha = {};
let combinedObject = {};

function openInbox(cb) {
  imap.openBox("INBOX", true, cb);
}

function toUpper(thing) { return thing && thing.toUpperCase ? thing.toUpperCase() : thing;}

function findAttachmentParts(struct, attachments) {
  attachments = attachments ||  [];
  for (var i = 0, len = struct.length, r; i < len; ++i) {
    if (Array.isArray(struct[i])) {
      findAttachmentParts(struct[i], attachments);
    } else {
      if (struct[i].disposition && ['INLINE', 'ATTACHMENT'].indexOf(toUpper(struct[i].disposition.type)) > -1) {
        attachments.push(struct[i]);
      }
    }
  }
  return attachments;
}

function buildAttMessageFunction(attachment) {
  var filename = attachment.params.name;
  var encoding = attachment.encoding;

  return function (msg, seqno) {
    var prefix = '(#' + seqno + ') ';
    msg.on('body', function(stream, info) {
      // Create a write stream to save the attachment to a file
      console.log(prefix + 'Streaming this attachment to file', filename);
      var writeStream = fs.createWriteStream(filename);
      writeStream.on('finish', function() {
        console.log(prefix + 'Done writing to file %s', filename);
      });

      // Check if the encoding is BASE64
      if (toUpper(encoding) === 'BASE64') {
        // Create a buffer to store the decoded data
        var buffer = Buffer.alloc(0);

        // Concatenate the chunks of the attachment stream
        stream.on('data', function(chunk) {
          buffer = Buffer.concat([buffer, chunk]);
        });

        // Decode the base64 buffer and pipe it to the write stream
        stream.on('end', function() {
          var decodedData = Buffer.from(buffer.toString('base64'), 'base64');
          writeStream.write(decodedData);
          writeStream.end();
        });
      } else {
        // Directly pipe the attachment stream to the write stream
        stream.pipe(writeStream);
      }
    });

    msg.once('end', function() {
      console.log(prefix + 'Finished attachment %s', filename);
    });
  };
}

function fetchMessagesFromMailbox(mailboxName) {
  const mailboxFullName = 'INBOX.' + mailboxName;
  imap.openBox(mailboxFullName, true, function (err, mailbox) {
    if (err) {
      processNextMailbox();
      return;
    }

    var f = imap.seq.fetch('1:*', { bodies: ['HEADER.FIELDS (FROM TO SUBJECT)', 'TEXT'], struct: true, flags: true });

    f.on('message', function (msg, seqno) {
      var prefix = '(#' + seqno + ') ';
      var header = {};
      var fecha = {};
      var cuerpo = {};
      var attrs; // Variable para almacenar los atributos del mensaje

      msg.on('body', function (stream, info) {
        if (info.which === 'TEXT') {
          var buffer = '';
          stream.on('data', function (chunk) {
            buffer += chunk.toString('utf8');
          });

          stream.once('end', function () {
           
            cuerpo = {
              mailbox: mailboxName,
              seqno: seqno,
              body: buffer,
              attachments: [] // Agregar un arreglo para almacenar los archivos adjuntos
            };
          });
        } else {
          var buffer = '';
          stream.on('data', function (chunk) {
            buffer += chunk.toString('utf8');
          });
          stream.once('end', function () {
            var parsedHeader = Imap.parseHeader(buffer);

            header = {
              from: parsedHeader.from,
              to: parsedHeader.to,
              subject: parsedHeader.subject,
            };
          });
        }
        
      });

      

      msg.once('attributes', function (messageAttrs) {
        var attachments = findAttachmentParts(messageAttrs.struct);
        console.log(prefix + 'Has attachments: %d', attachments.length);
        attrs = messageAttrs; // Asignar los atributos del mensaje a la variable attrs
        fecha = {
          date: attrs.date,
          flags: attrs.flags,
          uid: attrs.uid,
          modseq: attrs.modseq,
        };
        for (var i = 0, len=attachments.length ; i < len; ++i) {
          var attachment = attachments[i];
          /*This is how each attachment looks like {
              partID: '2',
              type: 'application',
              subtype: 'octet-stream',
              params: { name: 'file-name.ext' },
              id: null,
              description: null,
              encoding: 'BASE64',
              size: 44952,
              md5: null,
              disposition: { type: 'ATTACHMENT', params: { filename: 'file-name.ext' } },
              language: null
            }
          */
          console.log(prefix + 'Fetching attachment %s', attachment.params.name);
          var f = imap.fetch(attrs.uid , { //do not use imap.seq.fetch here
            bodies: [attachment.partID],
            struct: true
          });
          //build function to process attachment message
          f.on('message', buildAttMessageFunction(attachment));
        }
      });

      msg.once('end', function () {
        var isRead = attrs.flags.includes('\\Seen') ? true : false;
        var isStarred = attrs.flags.includes('\\Flagged') ? true : false;
        var hasReplies = attrs.struct && attrs.struct.length > 0 && attrs.struct[0].length > 0;
        var hasAttachments = attrs.struct && attrs.struct[0] && attrs.struct[0].disposition && attrs.struct[0].disposition.type === 'attachment';
    

        combinedObject[seqno] = {
          header: header,
          fecha: fecha,
          cuerpo: cuerpo,
          isRead: isRead,
          isStarred: isStarred,
          hasReplies: hasReplies,
          hasAttachments: hasAttachments,
        };
        
        
       
      });
    });

    f.once('error', function (err) {
      console.log('Fetch error: ' + err);
    });

    f.once('end', function () {
      imap.closeBox(true, function (err) {
        if (err) {
          console.log('Error closing mailbox:', err);
        }
        processNextMailbox();
      });
    });
  });
}

function processNextMailbox() {
  if (mailboxNames.length === 0) {
    imap.end();
   
    
    data.emails = transformToEmailsObject(combinedObject);
    return data
  }

  const mailboxName = mailboxNames.shift();
  fetchMessagesFromMailbox(mailboxName);
  
}
// Función que envuelve la lógica de procesamiento del correo en una promesa
function processMailbox() {
  return new Promise((resolve, reject) => {
    imap.once('ready', function () {
      openInbox(function (err, box) {
        if (err) reject(err);

        processNextMailbox();
        resolve();
      });
    });

    imap.once('error', function (err) {
      reject(err);
    });

    imap.once('end', function () {
      console.log('IMAP connection ended');
    });

    imap.connect();
  });
}





imap.once('ready', function () {
  openInbox(function (err, box) {
    if (err) throw err;

    processNextMailbox();
  });
});

imap.once('error', function (err) {
  console.log('IMAP error:', err);
});

imap.once('end', function () {
  console.log('IMAP connection ended');
});

imap.removeAllListeners("error");
imap.on("error", () => { });
imap.end();

imap.connect();




// ------------------------------------------------
// GET: Return Emails
// Router
router.get('/apps/email/allEmails', async (req, res) => {
  try {
    await processMailbox(); // Esperar a que se complete el procesamiento del correo
    // console.log(data)
    res.status(200).json({ emails: data.emails });
  } catch (error) {
    console.error('Error processing mailbox:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});





// ------------------------------------------------
// GET: Return Emails
router.get('/apps/email/emails', async (req, res) => {
  const { q = '', folder = 'inbox', label } = req.query;
  
  const queryLowered = q.toLowerCase();
  await processMailbox(); // Esperar a que se complete el procesamiento del correo
  
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
  );
  paramsFilteredMails = filteredData;

  

  const emailsMeta = {
    inbox: data.emails.filter(email => !email.isRead && email.folder === 'inbox').length,
    draft: data.emails.filter(email => email.folder === 'draft').length,
    spam: data.emails.filter(email => !email.isRead && email.folder === 'spam').length
  };

  

  res.status(200).json({
    emails: filteredData,
    emailsMeta
  });
});


// ------------------------------------------------
// POST: Update Emails Label
// ------------------------------------------------
router.post('/apps/email/update-emails-label',async (req, res) => {
  const { emailIds, label } = req.body.data;
  await processMailbox(); // Esperar a que se complete el procesamiento del correo
  function updateMailLabels(email) {
    const labelIndex = email.labels.indexOf(label);
    if (labelIndex === -1) email.labels.push(label);
    else email.labels.splice(labelIndex, 1);
  }

  data.emails.forEach(email => {
    if (emailIds.includes(email.id)) updateMailLabels(email);
  });

  res.sendStatus(200);
});



// ------------------------------------------------
// GET: GET Single Email
// ------------------------------------------------
router.get('/apps/email/get-email',async (req, res) => {
  const { id } = req.query;
  const emailId = Number(id);
 
  const mail = paramsFilteredMails.find(i => i.id === emailId);
  await processMailbox(); // Esperar a que se complete el procesamiento del correo

  if (mail) {
    const mailIndex = paramsFilteredMails.findIndex(i => i.id === mail.id);
    mail.hasPreviousMail = mailIndex > 0;
    mail.hasNextMail = mailIndex < paramsFilteredMails.length - 1;
  }

  if (mail) {
    res.status(200).json(mail);
  } else {
    res.sendStatus(404);
  }
});


// ------------------------------------------------
// POST: Update Email
// ------------------------------------------------
router.post('/apps/email/update-emails', async (req, res) => {
  const { emailIds, dataToUpdate } = req.body.data;
  await processMailbox(); // Esperar a que se complete el procesamiento del correo
  function updateMailData(email) {
    Object.assign(email, dataToUpdate);
  }

  data.emails.forEach(email => {
    if (emailIds.includes(email.id)) {
      updateMailData(email);
    }
  });

  res.sendStatus(200);
});


// ------------------------------------------------
// GET: Paginate Existing Email
// ------------------------------------------------
router.get('/apps/email/paginate-email',async (req, res) => {
  const { dir, emailId } = req.query;
  await processMailbox(); // Esperar a que se complete el procesamiento del correo
  const currentEmailIndex = paramsFilteredMails.findIndex(e => e.id === emailId);
  const newEmailIndex = dir === 'previous' ? currentEmailIndex - 1 : currentEmailIndex + 1;
  const newEmail = paramsFilteredMails[newEmailIndex];
  if (newEmail) {
    const mailIndex = paramsFilteredMails.findIndex(i => i.id === newEmail.id);
    mailIndex > 0 ? (newEmail.hasPreviousMail = true) : (newEmail.hasPreviousMail = false);
    mailIndex < paramsFilteredMails.length - 1 ? (newEmail.hasNextMail = true) : (newEmail.hasNextMail = false);
  }

  return newEmail ? res.status(200).json(newEmail) : res.sendStatus(404);
});

export default router;
