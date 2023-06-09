import { Router } from "express";

const router = Router()

//Crear el arbol desplegable del programa
router.get('/data', async (req, res) => {
    // Obtenemos los datos que deseamos enviar al cliente
    const navigation =
        [
            // {
            //     title: 'Home',
            //     path: '/home',
            //     icon: 'mdi:home-outline',
               
            // },
            {
                sectionTitle: 'Secciones',
                action: 'read',
            },
            {
                title: 'Clientes',
                icon: 'mdi:account-outline',
                path: '/apps/user/list',
                // children: [
                //     {
                //         title: 'Lista de Clientes',
                //         path: '/apps/user/list'
                //     }
                    // {
                    //     title: 'Cliente',
                    //     children: [
                    //         {
                    //             title: 'Perfil',
                    //             path: '/apps/user/view/overview'
                    //         }
                    //     ]
                    // }
                // ]
            },
            // {
            //     title: 'Email',
            //     icon: 'mdi:email-outline',
            //     path: '/apps/email'
            //   },
            {
                path: '/apps/remesas/lista',
                title: 'Remesas',
                icon: 'ph:bank-bold',
            },
            {
                title: 'Calendario',
                icon: 'mdi:calendar-blank-outline',
                action: 'read',
                subject: 'calendario',
                path: '/apps/calendar'
              },
            {
                sectionTitle: 'Normas',
                action: 'read',
            },
            {
                title: 'Terminos',
                path: '/apps/terminos',
                action: 'read',
                subject: 'terminos',
                icon: 'mdi:contract-outline',
            },
            {
                sectionTitle: 'Horarios',
                action: 'read',
            },
            {
                title: 'Horarios',
                path: '/apps/horarios',
                action: 'read',
                subject: 'horarios',
                icon: 'mdi:contract-outline',
            },
            // {
            //     path: '/acl',
            //     action: 'read',
            //     subject: 'acl-page',
            //     icon: 'mdi:shield-outline',
            //     title: 'Access Control'
            //   }
            
        ]
    // Enviamos los datos al cliente
    res.send(navigation);
});



export default router