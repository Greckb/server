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
                sectionTitle: 'Secciones'
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
            {
                title: 'Email',
                icon: 'mdi:email-outline',
                path: '/apps/email'
              },
             {
                path: '/apps/remesas/lista',
                action: 'read',
                subject: 'acl-page',
                title: 'Remesas',
                icon: 'ph:bank-bold',
            },
            {
                path: '/acl',
                action: 'read',
                subject: 'acl-page',
                title: 'Access Control',
                icon: 'mdi:shield-outline',
            },
            
        ]
    // Enviamos los datos al cliente
    res.send(navigation);
    console.log('data')
});



export default router