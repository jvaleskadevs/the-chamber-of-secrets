import * as yup from 'yup';

export const timelockParamsSchema = yup.object({
  plaintext: yup.string().required(),
  //ciphertext: yup.string().nullable(true).optional(),
  decryptionTime: yup.number()
    .positive()
    .required()
}).required();
