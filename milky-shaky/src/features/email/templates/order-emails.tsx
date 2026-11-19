import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { formatPickup, formatZAR } from "../format";

export interface EmailOrderItem {
  flavourName: string;
  consistencyName: string;
  toppingName: string;
  unitPriceCents: number;
}

export interface EmailOrderData {
  reference: string;
  firstName: string;
  restaurantName: string;
  restaurantAddress: string;
  pickupAt: Date;
  items: EmailOrderItem[];
  subtotalCents: number;
  discountCents: number;
  vatPercent: string;
  vatCents: number;
  totalCents: number;
}

const body = { backgroundColor: "#f6f6f6", fontFamily: "Arial, sans-serif", margin: 0, padding: "24px 0" };
const card = { backgroundColor: "#ffffff", borderRadius: "8px", padding: "24px", margin: "0 auto", maxWidth: "560px" };
const muted = { color: "#555555", fontSize: "14px", margin: "4px 0" };
const row = { display: "flex", justifyContent: "space-between", fontSize: "14px", margin: "4px 0" };

function Totals({ data }: { data: EmailOrderData }) {
  return (
    <Section>
      <Text style={row}>Subtotal <span>{formatZAR(data.subtotalCents)}</span></Text>
      {data.discountCents > 0 && (
        <Text style={row}>Frequent customer discount <span>-{formatZAR(data.discountCents)}</span></Text>
      )}
      <Text style={row}>VAT ({data.vatPercent}%) <span>{formatZAR(data.vatCents)}</span></Text>
      <Text style={{ ...row, fontWeight: "bold", fontSize: "16px" }}>
        Total <span>{formatZAR(data.totalCents)}</span>
      </Text>
    </Section>
  );
}

function Drinks({ items }: { items: EmailOrderItem[] }) {
  return (
    <Section>
      {items.map((item, i) => (
        <Text key={i} style={row}>
          {i + 1}. {item.flavourName} · {item.consistencyName} · {item.toppingName}
          <span>{formatZAR(item.unitPriceCents)}</span>
        </Text>
      ))}
    </Section>
  );
}

function Pickup({ data }: { data: EmailOrderData }) {
  return (
    <Section>
      <Text style={muted}><strong>Pickup:</strong> {formatPickup(data.pickupAt)}</Text>
      <Text style={muted}><strong>Restaurant:</strong> {data.restaurantName}, {data.restaurantAddress}</Text>
    </Section>
  );
}

export function OrderConfirmationEmail({ data }: { data: EmailOrderData }) {
  return (
    <Html>
      <Head />
      <Preview>Order {data.reference} received. Complete payment to confirm it.</Preview>
      <Body style={body}>
        <Container style={card}>
          <Heading as="h2">Thanks, {data.firstName}!</Heading>
          <Text>Your order {data.reference} is saved. Complete payment to confirm it.</Text>
          <Pickup data={data} />
          <Hr />
          <Drinks items={data.items} />
          <Hr />
          <Totals data={data} />
        </Container>
      </Body>
    </Html>
  );
}

export function PaymentReceiptEmail({ data, paidAt, paymentReference }: {
  data: EmailOrderData;
  paidAt: Date;
  paymentReference: string;
}) {
  return (
    <Html>
      <Head />
      <Preview>Payment received for order {data.reference}</Preview>
      <Body style={body}>
        <Container style={card}>
          <Heading as="h2">Payment received</Heading>
          <Text>Thanks, {data.firstName}. Your order {data.reference} is confirmed.</Text>
          <Section>
            <Text style={muted}><strong>Paid:</strong> {formatPickup(paidAt)}</Text>
            <Text style={muted}><strong>Payment reference:</strong> {paymentReference}</Text>
          </Section>
          <Hr />
          <Pickup data={data} />
          <Hr />
          <Drinks items={data.items} />
          <Hr />
          <Totals data={data} />
          <Text style={{ ...muted, marginTop: "16px" }}>Show this email or your order number when you collect.</Text>
        </Container>
      </Body>
    </Html>
  );
}