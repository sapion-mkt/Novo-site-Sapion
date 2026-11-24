/* ==========================================================================
   Configuração do site — é só preencher aqui, sem mexer no resto do código.

   formEndpoint  Endereço que recebe os dados do formulário "Agende uma
                 apresentação" (POST em JSON). Pode ser um webhook do CRM,
                 do SendPulse, de uma automação (Make/Zapier) ou de um
                 serviço de formulários (Formspree, Web3Forms...).
                 Vazio = o formulário só valida e mostra a confirmação.

   ga4           ID de medição do Google Analytics 4 (ex.: "G-XXXXXXXXXX").
   metaPixel     ID do Meta Pixel (ex.: "123456789012345").
                 Com qualquer um dos dois preenchido, o aviso de cookies
                 aparece e a medição só carrega depois do "Aceitar" (LGPD).
   ========================================================================== */
window.SAPION_CONFIG = {
  formEndpoint: "",
  ga4: "",
  metaPixel: ""
};
