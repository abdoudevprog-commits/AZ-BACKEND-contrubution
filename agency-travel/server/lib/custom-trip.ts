import type { CustomTripRequest, CustomTripResponse } from "../../shared/api";

interface HandlerResult<T> {
  status: number;
  body: T;
}

const MAX_CHILD_AGE = 100;
const DEFAULT_TRIP_RECIPIENT_EMAIL = "devisaz.off@gmail.com";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatChildAge(age: number): string {
  return `${age} ${age === 1 ? "an" : "ans"}`;
}

export async function processCustomTrip(
  request: CustomTripRequest,
): Promise<HandlerResult<CustomTripResponse>> {
  const {
    fullName,
    phone,
    email,
    destinations,
    startDate,
    endDate,
    budget,
    adults,
    children,
    childAges,
  } = request;

  if (!fullName || !phone || !email || !destinations?.length) {
    return {
      status: 400,
      body: { success: false, message: "Missing required fields." },
    };
  }

  const normalizedChildAges = Array.isArray(childAges) ? childAges : [];
  const childAgesAreValid =
    normalizedChildAges.length === children &&
    normalizedChildAges.every(
      (age) => Number.isInteger(age) && age >= 0 && age <= MAX_CHILD_AGE,
    );

  if (!childAgesAreValid) {
    return {
      status: 400,
      body: {
        success: false,
        message:
          "Les âges des enfants sont obligatoires et doivent correspondre au nombre d'enfants.",
      },
    };
  }

  const resendApiKey =
    process.env.RESEND_API_KEY?.trim() || process.env.API_RESEND?.trim();
  const recipientEmail =
    process.env.TRIP_RECIPIENT_EMAIL?.trim() || DEFAULT_TRIP_RECIPIENT_EMAIL;

  if (!resendApiKey) {
    console.error("RESEND_API_KEY not set; custom trip email was not sent.");
    console.log("Custom trip request:", JSON.stringify(request, null, 2));

    return {
      status: 503,
      body: {
        success: false,
        message: "Le service email n'est pas configuré. Ajoutez RESEND_API_KEY pour envoyer la demande.",
      },
    };
  }

  const html = `
    <h2>Nouvelle demande de voyage sur mesure</h2>
    <table style="border-collapse:collapse;width:100%;max-width:600px;font-family:sans-serif;">
      <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Nom</td><td style="padding:8px;border:1px solid #ddd;">${escapeHtml(fullName)}</td></tr>
      <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Téléphone</td><td style="padding:8px;border:1px solid #ddd;">${escapeHtml(phone)}</td></tr>
      <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Email</td><td style="padding:8px;border:1px solid #ddd;">${escapeHtml(email)}</td></tr>
      <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Destinations</td><td style="padding:8px;border:1px solid #ddd;">${destinations.map(escapeHtml).join(", ")}</td></tr>
      <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Date de départ</td><td style="padding:8px;border:1px solid #ddd;">${escapeHtml(startDate || "Non spécifiée")}</td></tr>
      <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Date de retour</td><td style="padding:8px;border:1px solid #ddd;">${escapeHtml(endDate || "Non spécifiée")}</td></tr>
      <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Budget</td><td style="padding:8px;border:1px solid #ddd;">${escapeHtml(budget || "Non spécifié")} DZD</td></tr>
      <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Adultes</td><td style="padding:8px;border:1px solid #ddd;">${adults}</td></tr>
      <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Enfants</td><td style="padding:8px;border:1px solid #ddd;">${children}</td></tr>
      <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Âges des enfants</td><td style="padding:8px;border:1px solid #ddd;">${normalizedChildAges.length > 0 ? normalizedChildAges.map((age) => escapeHtml(formatChildAge(age))).join(", ") : "Aucun"}</td></tr>
    </table>
  `;

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(resendApiKey);

    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "AZ Voyage <onboarding@resend.dev>",
      to: recipientEmail,
      subject: `Voyage sur mesure - ${fullName}`,
      html,
      replyTo: email,
    });

    if (error || !data?.id) {
      console.error("Custom trip email provider error:", error ?? "Missing email id.");

      return {
        status: 502,
        body: { success: false, message: "Erreur lors de l'envoi." },
      };
    }

    return {
      status: 200,
      body: { success: true, message: "Demande envoyée avec succès." },
    };
  } catch (error) {
    console.error("Custom trip email error:", error);

    return {
      status: 500,
      body: { success: false, message: "Erreur lors de l'envoi." },
    };
  }
}
