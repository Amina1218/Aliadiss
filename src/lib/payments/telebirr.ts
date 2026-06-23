import { getAppBaseUrl, isPaymentSandbox } from '@/lib/payments'

export interface InitiatePaymentInput {
  orderId: string
  amountBirr: number
  phone: string
  description: string
}

export interface InitiatePaymentResult {
  provider: 'TELEBIRR'
  transactionId: string
  redirectUrl: string
  sandbox: boolean
}

function normalizePhone(phone: string) {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('251')) return digits
  if (digits.startsWith('0')) return `251${digits.slice(1)}`
  if (digits.length === 9) return `251${digits}`
  return digits
}

export async function initiateTelebirrPayment(input: InitiatePaymentInput): Promise<InitiatePaymentResult> {
  const phone = normalizePhone(input.phone)
  const transactionId = `TB-${input.orderId.slice(-8).toUpperCase()}-${Date.now()}`
  const baseUrl = getAppBaseUrl()

  if (isPaymentSandbox()) {
    return {
      provider: 'TELEBIRR',
      transactionId,
      redirectUrl: `${baseUrl}/shop/payment/${input.orderId}?provider=telebirr&txn=${transactionId}`,
      sandbox: true,
    }
  }

  const appId = process.env.TELEBIRR_APP_ID
  const appKey = process.env.TELEBIRR_APP_KEY
  const apiUrl = process.env.TELEBIRR_API_URL

  if (!appId || !appKey || !apiUrl) {
    throw new Error('Telebirr is not configured. Set TELEBIRR_APP_ID, TELEBIRR_APP_KEY, and TELEBIRR_API_URL.')
  }

  const notifyUrl = `${baseUrl}/api/payments/webhook/telebirr`
  const returnUrl = `${baseUrl}/shop/payment/${input.orderId}?provider=telebirr`

  const payload = {
    appId,
    outTradeNo: transactionId,
    subject: input.description,
    totalAmount: input.amountBirr.toFixed(2),
    shortCode: process.env.TELEBIRR_SHORT_CODE,
    notifyUrl,
    returnUrl,
    receiveName: 'Ali Addis',
    timeoutExpress: '30',
    phone,
  }

  const res = await fetch(`${apiUrl}/payment/initiate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${appKey}`,
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Telebirr payment failed: ${err}`)
  }

  const data = await res.json()
  const paymentUrl = data.paymentUrl || data.data?.paymentUrl || data.toPayUrl

  if (!paymentUrl) throw new Error('Telebirr did not return a payment URL')

  return {
    provider: 'TELEBIRR',
    transactionId,
    redirectUrl: paymentUrl,
    sandbox: false,
  }
}
