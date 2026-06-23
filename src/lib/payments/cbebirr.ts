import { getAppBaseUrl, isPaymentSandbox } from '@/lib/payments'

export interface InitiatePaymentInput {
  orderId: string
  amountBirr: number
  phone: string
  description: string
}

export interface InitiatePaymentResult {
  provider: 'CBE_BIRR'
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

export async function initiateCbeBirrPayment(input: InitiatePaymentInput): Promise<InitiatePaymentResult> {
  const phone = normalizePhone(input.phone)
  const transactionId = `CBE-${input.orderId.slice(-8).toUpperCase()}-${Date.now()}`
  const baseUrl = getAppBaseUrl()

  if (isPaymentSandbox()) {
    return {
      provider: 'CBE_BIRR',
      transactionId,
      redirectUrl: `${baseUrl}/shop/payment/${input.orderId}?provider=cbebirr&txn=${transactionId}`,
      sandbox: true,
    }
  }

  const merchantId = process.env.CBE_BIRR_MERCHANT_ID
  const apiKey = process.env.CBE_BIRR_API_KEY
  const apiUrl = process.env.CBE_BIRR_API_URL

  if (!merchantId || !apiKey || !apiUrl) {
    throw new Error('CBE Birr is not configured. Set CBE_BIRR_MERCHANT_ID, CBE_BIRR_API_KEY, and CBE_BIRR_API_URL.')
  }

  const callbackUrl = `${baseUrl}/api/payments/webhook/cbebirr`
  const returnUrl = `${baseUrl}/shop/payment/${input.orderId}?provider=cbebirr`

  const payload = {
    merchantId,
    orderId: transactionId,
    amount: input.amountBirr,
    currency: 'ETB',
    customerPhone: phone,
    description: input.description,
    callbackUrl,
    returnUrl,
  }

  const res = await fetch(`${apiUrl}/api/v1/payment/request`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`CBE Birr payment failed: ${err}`)
  }

  const data = await res.json()
  const paymentUrl = data.paymentUrl || data.redirectUrl || data.data?.checkoutUrl

  if (!paymentUrl) throw new Error('CBE Birr did not return a payment URL')

  return {
    provider: 'CBE_BIRR',
    transactionId,
    redirectUrl: paymentUrl,
    sandbox: false,
  }
}
