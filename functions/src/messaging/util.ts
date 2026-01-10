import * as mustache from "mustache";

// Define message templates
const TEMPLATES = {
  ORDER_PAYMENT_CREATED: `*🛒 Ваш заказ*

*Товары:*
{{#items}}
- *{{name}} *: *{{price}} ₽*

{{/items}}
{{#delivery}}
*🚚 Доставка:*
c *{{deliveryStart}}* по *{{deliveryEnd}}*
{{/delivery}}
{{^delivery}}
❓ Доставка еще не определена
{{/delivery}}
*💰 Общая сумма:* *{{total}} ₽*
*ID заказа:* \`{{orderId}}\`

🔗 Ссылка на оплату: {{{paymentUrl}}}`,
  ORDER_CONCILIATED: `✅ Ваш заказ собран. Мы оповестим вас когда и где его можно будет забрать.

Номер заказ {{orderId}}`,
  ORDER_PAYMENT_CONFIRMED_CONCILIATION: `✅ Разница по заказу успешно оплачена!
Исходный заказ: *{{originalOrderId}}*`,
  ORDER_PAYMENT_CONFIRMED_ORIGINAL: `✅ Мы приняли оплату за ваш заказ.
Вы заказали:

{{#items}}
*{{name}}* : {{price}}₽
{{/items}}

Общая стоимость заказа: {{total}}₽

Благодарим за покупку. При каждом важном изменении заказа, мы будем присылать обновление в чат. По всем вопросам просим писать @antonoldenberg`,
  ORDER_PAYMENT_CONFIRMED_ADMIN: "✅ Ордер оплачен!: {{orderId}}",
  ORDER_CREATED_ADMIN: "✅ Создан ордер: {{orderId}}",
  SUBSCRIPTION_PAYMENT_CONFIRMED_ADMIN: "✅ Подписка оплачена!: {{subscriptionId}}",
  SUBSCRIPTION_PAYMENT_FAILED_ADMIN: "❗️ Ошибка оплаты подписки!: {{subscriptionId}}",
  SUBSCRIPTION_CANCELED_ADMIN: "❗️ Подписка отменена за неуплату: {{subscriptionId}}",
};

/**
 * Process a template with given values using mustache.js
 * @param templateName - Name of the template to use
 * @param values - Object containing values to substitute in the template
 * @return Processed message string
 */
export function toMessage(templateName: keyof typeof TEMPLATES, values: Record<string, any>): string {
  const template = TEMPLATES[templateName];
  if (!template) {
    throw new Error(`Template '${templateName}' not found`);
  }

  return mustache.render(template, values);
}

/**
 * Format date to dd.mm.yyyy format
 * @param input - Date object or string
 * @return Formatted date string
 */
export function formatDate(input: Date | string): string {
  const date = input instanceof Date ? input : new Date(input);
  const dd = String(date.getUTCDate()).padStart(2, "0");
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const yyyy = date.getUTCFullYear();
  return `${dd}.${mm}.${yyyy}`;
}
