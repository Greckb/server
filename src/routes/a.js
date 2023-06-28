const data = {
  emails: [
    {
      id: 1,
      from: {
        email: 'tommys@mail.com',
        name: 'Tommy Sicilia',
        avatar: '/images/avatars/1.png'
      },
      to: [
        {
          name: 'me',
          email: 'johndoe@mail.com'
        }
      ],
      subject: 'How to Succeed with Your Shopify Store',
      cc: [],
      bcc: [],
      message:
        '<p>Hi John,</p><p>How to Choose the Perfect Shopify Theme and Build Your Online Store Fast! (keywords: how to create a shopify store, how to start selling on shopify)</p><p>Shopify Tutorials That Will Save You 5 Hours of Time and $150 A Month!</p><p>Can I Start My Own ECommerce Business Without Knowing How To Code?</p><p>The One Thing All Shopify Entrepreneurs Have in Common</p><p>Regrads,</p><p>Tommy Sicilia</p>',
      attachments: [
        {
          fileName: 'log.txt',
          thumbnail: '/images/icons/file-icons/txt.png',
          url: '',
          size: '5mb'
        },
        {
          fileName: 'performance.xls',
          thumbnail: '/images/icons/file-icons/xls.png',
          url: '',
          size: '10mb'
        }
      ],
      isStarred: false,
      labels: ['private'],
      time: 'Mon Dec 10 2018 07:46:00 GMT+0000 (GMT)',
      replies: [],
      folder: 'inbox',
      isRead: true
    },
    {
      id: 2,
      from: {
        email: 'tressag@mail.com',
        name: 'Tressa Gass',
        avatar: '/images/avatars/6.png'
      },
      to: [
        {
          name: 'me',
          email: 'johndoe@mail.com'
        }
      ],
      subject: 'Please find attached the latest Company Report',
      cc: ['vrushankbrahmshatriya@mail.com'],
      bcc: ['menka@mail.com'],
      message:
        ' <p>Hello John,</p><p>I hope you are doing well.</p><p> I am sending over a company report for company. It is a PDF file.</p><p>Please let me know if you want to schedule a call or any other questions.</p><p>Regrads</p><p>Tressa Gass</p>',
      attachments: [
        {
          fileName: 'company-report.pdf',
          thumbnail: '/images/icons/file-icons/pdf.png',
          url: '',
          size: '32mb'
        }
      ],
      isStarred: true,
      labels: ['company', 'private'],
      time: 'Mon Dec 10 2018 07:55:00 GMT+0000 (GMT)',
      replies: [],
      folder: 'inbox',
      isRead: true
    },
    {
      id: 3,
      from: {
        email: 'hettiem@mail.com',
        name: 'Hettie Mcerlean',
        avatar: '/images/avatars/3.png'
      },
      to: [
        {
          name: 'me',
          email: 'johndoe@mail.com'
        }
      ],
      subject: 'Your order has been delivered',
      cc: [],
      bcc: [],
      message:
        '<p>Hello John,</p><p>Your order has just been delivered. Here is the delivery confirmation number: #569443</p><p>Regrads</p><p>If you have any questions, please feel free to reach out to our customer service team at customerService@email.com</p><p>Hettie Mcerlean</p>',
      attachments: [],
      isStarred: false,
      labels: ['company'],
      time: 'Mon Dec 10 2018 08:35:00 GMT+0000 (GMT)',
      replies: [],
      folder: 'spam',
      isRead: true
    },
   
  ]
}