/**
 * ┌──────────────────────────────────────────────────────────────────────────────┐
 * │ @author jrCleber                                                             │
 * │ @filename sendMessage.router.ts                                              │
 * │ Developed by: Cleber Wilson                                                  │
 * │ Creation date: Nov 27, 2022                                                  │
 * │ Contact: contato@codechat.dev                                                │
 * ├──────────────────────────────────────────────────────────────────────────────┤
 * │ @copyright © Cleber Wilson 2022. All rights reserved.                        │
 * │ Licensed under the Apache License, Version 2.0                               │
 * │                                                                              │
 * │  @license "https://github.com/code-chat-br/whatsapp-api/blob/main/LICENSE"   │
 * │                                                                              │
 * │ You may not use this file except in compliance with the License.             │
 * │ You may obtain a copy of the License at                                      │
 * │                                                                              │
 * │    http://www.apache.org/licenses/LICENSE-2.0                                │
 * │                                                                              │
 * │ Unless required by applicable law or agreed to in writing, software          │
 * │ distributed under the License is distributed on an "AS IS" BASIS,            │
 * │ WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.     │
 * │                                                                              │
 * │ See the License for the specific language governing permissions and          │
 * │ limitations under the License.                                               │
 * │                                                                              │
 * │ @class                                                                       │
 * │ @constructs MessageRouter @extends RouterBroker                              │
 * │ @param {RequestHandler[]} guards                                             │
 * ├──────────────────────────────────────────────────────────────────────────────┤
 * │ @important                                                                   │
 * │ For any future changes to the code in this file, it is recommended to        │
 * │ contain, together with the modification, the information of the developer    │
 * │ who changed it and the date of modification.                                 │
 * └──────────────────────────────────────────────────────────────────────────────┘
 */

import { PrismaClient } from '@prisma/client';
import { isEmpty } from 'class-validator';
import { NextFunction, Request, RequestHandler, Response, Router } from 'express';
import multer from 'multer';
import { HttpStatus } from '../../app.module';
import { BadRequestException } from '../../exceptions';
import { dataValidate, routerPath } from '../../validate/router.validate';
import {
  audioFileMessageSchema,
  audioMessageSchema,
  buttonsMessageSchema,
  contactMessageSchema,
  listMessageSchema,
  locationMessageSchema,
  mediaFileMessageSchema,
  mediaMessageSchema,
  reactionMessageSchema,
  textMessageSchema,
} from '../../validate/validate.schema';
import { SendMessageController } from '../controllers/sendMessage.controller';
import {
  AudioMessageFileDto,
  MediaFileDto,
  SendAudioDto,
  SendButtonsDto,
  SendContactDto,
  SendListDto,
  SendLocationDto,
  SendMediaDto,
  SendReactionDto,
  SendTextDto
} from '../dto/sendMessage.dto';

function validateMedia(req: Request, _: Response, next: NextFunction) {
  if (!req?.file || req.file.fieldname !== 'attachment') {
    throw new BadRequestException('Invalid File');
  }

  if (isEmpty(req.body?.presence)) {
    req.body.presence = undefined;
  }

  next();
}

export function MessageRouter(
  sendMessageController: SendMessageController,
  ...guards: RequestHandler[]
) {
  const uploadFile = multer({ preservePath: true });

  const router = Router()
    .post(routerPath('sendText'), ...guards, async (req, res) => {
      const response = await dataValidate<SendTextDto>({
        request: req,
        schema: textMessageSchema,
        execute: (instance, data) => sendMessageController.sendText(instance, data),
      });

      return res.status(HttpStatus.CREATED).json(response);
    })
    .post(routerPath('sendMedia'), ...guards, async (req, res) => {
      const response = await dataValidate<SendMediaDto>({
        request: req,
        schema: mediaMessageSchema,
        execute: (instance, data) => sendMessageController.sendMedia(instance, data),
      });

      return res.status(HttpStatus.CREATED).json(response);
    })
    .post(
      routerPath('sendMediaFile'),
      ...guards,
      uploadFile.single('attachment'),
      validateMedia,
      async (req, res) => {
        const response = await dataValidate<MediaFileDto>({
          request: req,
          schema: mediaFileMessageSchema,
          execute: (instance, data, file) =>
            sendMessageController.sendMediaFile(instance, data, file),
        });
        return res.status(HttpStatus.CREATED).json(response);
      },
    )
    .post(routerPath('sendWhatsAppAudio'), ...guards, async (req, res) => {
      const response = await dataValidate<SendAudioDto>({
        request: req,
        schema: audioMessageSchema,
        execute: (instance, data) =>
          sendMessageController.sendWhatsAppAudio(instance, data),
      });

      return res.status(HttpStatus.CREATED).json(response);
    })
    .post(
      routerPath('sendWhatsAppAudioFile'),
      ...guards,
      uploadFile.single('attachment'),
      validateMedia,
      async (req, res) => {
        const response = await dataValidate<AudioMessageFileDto>({
          request: req,
          schema: audioFileMessageSchema,
          execute: (instance, data, file) =>
            sendMessageController.sendWhatsAppAudioFile(instance, data, file),
        });
        return res.status(HttpStatus.CREATED).json(response);
      },
    )
    .post(routerPath('sendLocation'), ...guards, async (req, res) => {
      const response = await dataValidate<SendLocationDto>({
        request: req,
        schema: locationMessageSchema,
        execute: (instance, data) => sendMessageController.sendLocation(instance, data),
      });

      return res.status(HttpStatus.CREATED).json(response);
    })
    .post(routerPath('sendContact'), ...guards, async (req, res) => {
      const response = await dataValidate<SendContactDto>({
        request: req,
        schema: contactMessageSchema,
        execute: (instance, data) => sendMessageController.sendContact(instance, data),
      });

      return res.status(HttpStatus.CREATED).json(response);
    })
    .post(routerPath('sendReaction'), ...guards, async (req, res) => {
      const response = await dataValidate<SendReactionDto>({
        request: req,
        schema: reactionMessageSchema,
        execute: (instance, data) => sendMessageController.sendReaction(instance, data),
      });

      return res.status(HttpStatus.CREATED).json(response);
    })
    .post(routerPath('sendButtons'), ...guards, async (req, res) => {
      const response = await dataValidate<SendButtonsDto>({
        request: req,
        schema: buttonsMessageSchema,
        execute: (instance, data) => {
          try {
            const props = new SendButtonsDto(data);
            for (let i = 0; i < props.buttonsMessage.buttons.length; i++) {
              const err = props.buttonsMessage.buttons[i].validate();
              if (err) {
                throw new BadRequestException(err.message);
              }
            }
            return sendMessageController.sendButtons(instance, props);
          } catch (error) {
            throw new BadRequestException(error.message, error?.stack);
          }
        },
      });

      return res.status(HttpStatus.CREATED).json(response);
    })
    .post(routerPath('sendList'), ...guards, async (req, res) => {
      const response = await dataValidate<SendListDto>({
        request: req,
        schema: listMessageSchema,
        execute: (instance, data) => {
          try {
            return sendMessageController.sendList(instance, new SendListDto(data));
          } catch (error) {
            throw new BadRequestException(error.message, error?.stack);
          }
        },
      });

      return res.status(HttpStatus.CREATED).json(response);
    })
    .post(routerPath('registrarConvidados'), ...guards, async (req, res) => {
      const body = req.body;

      const prisma = new PrismaClient();

      for await (const convidado of body) {
        const convidadoExist = await prisma.convidados.findFirst({
          where: {
            phone: convidado.phone,
          },
        });
        if (!convidadoExist) {
          await prisma.convidados.create({
            data: {
              nome: convidado.nome,
              phone: convidado.phone,
              presente: convidado.presente,
            },
          });
        }
      }

      const convidados = await prisma.convidados.findMany();

      return res.status(HttpStatus.CREATED).json(convidados);
    })
    .get(routerPath('confirmados'), ...guards, async (req, res) => {
      const prisma = new PrismaClient();

      const convidados = await prisma.convidados.findMany();

      return res.status(HttpStatus.CREATED).json({
        totalConvites: convidados.length,
        totalConfirmados: convidados.filter((convidado) => convidado.confirmed).length,
        confirmados: convidados.filter((convidado) => convidado.confirmed),
      });
    })
    .get(routerPath('sendConvite'), ...guards, async (req, res) => {
      const myHeaders = new Headers();
      myHeaders.append('Content-Type', 'application/json');
      myHeaders.append('apikey', 'zYzP7ocstxh3Sscefew4FZTCu4ehnM8v4hu');

      const prisma = new PrismaClient();

      const convidados = await prisma.convidados.findMany({
        where: {
          confirmed: false,
        },
      });

      const sendConvite = async (convidado) => {
        // const raw = JSON.stringify({
        //   number: convidado.phone,
        //   options: {
        //     delay: 1200,
        //     presence: 'composing',
        //   },
        //   buttonsMessage: {
        //     thumbnailUrl: 'https://i.imgur.com/IDJTzgy.jpeg',
        //     title: 'Convite especial',
        //     description: `Olá ${convidado.nome}, com as bençãos de Deus e de nossos pais e familiares, te convidamos para celebrar o amor\n\n*Rafael e Letícia*\n\n20 de setembro as 19h30\n\n*Local:* Espaço lounge festas\nRua Miguel Rangel 160, Cascadura - RJ`,
        //     buttons: [
        //       {
        //         type: 'reply',
        //         displayText: 'Endereço/horário',
        //         id: 'localizacao',
        //       },
        //       {
        //         type: 'reply',
        //         displayText: 'Confirmar presença',
        //         id: 'confirmar_presenca',
        //       },
        //       {
        //         type: 'reply',
        //         displayText: 'Falar com noivos',
        //         id: 'falar_com',
        //       },
        //       {
        //         type: "url",
        //         displayText: "Lista de presentes",
        //         url: "https://noivos.casar.com/leticia-e-rafael-2024-09-20#/presentes"
        //       },
        //     ],
        //   },
        // });

        // const res = await fetch(`${process.env.BASE_URL}/message/sendButtons/baby`, {
        //   method: 'POST',
        //   headers: myHeaders,
        //   body: raw,
        //   redirect: 'follow',
        // })
        //   .then((response) => response.json())
        //   // .then((result) => console.log(result))
        //   .catch((error) => console.error(error));

        // console.log("RES", res.content.message)

        // if (res.device === "ios") {
          
          const rawImage = JSON.stringify({
            number: convidado.phone,
            options: {
              delay: 200,
              presence: 'composing',
              quotedMessageId: 1
            },
            mediaMessage: {
              mediatype: "image",
              media: "https://i.imgur.com/IDJTzgy.jpeg"
            }
          });

          await fetch(`${process.env.BASE_URL}/message/sendMedia/baby`, {
            method: 'POST',
            headers: myHeaders,
            body: rawImage,
            redirect: 'follow',
          })
            .then((response) => response.json())
            // .then((result) => console.log(result))
            .catch((error) => console.error(error));

          const raw = JSON.stringify({
            number: convidado.phone,
            options: {
              delay: 2000,
              presence: 'composing',
            },
            textMessage: {
              text: `
*Convite especial*

Olá ${convidado.nome}, com as bençãos de Deus e de nossos pais e familiares, te convidamos para celebrar o amor!

*Rafael e Letícia*

_Digite o número para a opção:_

*1* - Endereço/horário
*2* - Confirmar presença
*3* - Falar com noivos
*4* - Lista de presentes`
            }
          });

        await fetch(`${process.env.BASE_URL}/message/sendText/baby`, {
          method: 'POST',
          headers: myHeaders,
          body: raw,
          redirect: 'follow',
        })
          .then((response) => response.json())
          // .then((result) => console.log(result))
          .catch((error) => console.error(error));

        // }
      };

      for (const [index, convidado] of convidados.entries()) {
        setTimeout(() => {
          sendConvite(convidado);
        }, index * 60000);
      }

      return res.status(HttpStatus.CREATED).json({ message: 'Convites sendo enviados' });
    });

  return router;
}

