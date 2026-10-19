import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 3000);
const orderToEmail = process.env.ORDER_TO_EMAIL;
const orderFromEmail = process.env.ORDER_FROM_EMAIL;
const resendApiKey = process.env.RESEND_API_KEY;
const products = new Map([
    [1, { name: "Performance Controller", price: 499 }],
    [2, { name: "Precision Throttle", price: 129 }],
    [3, { name: "Lithium Battery", price: 899 }],
    [4, { name: "Battery Bag", price: 79 }],
    [5, { name: "Lock-On Grips", price: 49 }],
    [6, { name: "Racing Handlebars", price: 289 }],
    [7, { name: "CNC Foot Pegs", price: 149 }],
    [8, { name: "Rear Dropouts", price: 259 }]
]);
const rateLimits = new Map();
const maxRequestBytes = 12_000;

function sendJson(response, status, payload) {
    response.writeHead(status, {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff"
    });
    response.end(JSON.stringify(payload));
}

function escapeHtml(value) {
    return value.replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

function isText(value, maxLength) {
    return typeof value === "string" &&
        value.trim().length > 0 &&
        value.trim().length <= maxLength;
}

async function readJson(request) {
    let body = "";

    for await (const chunk of request) {
        body += chunk;

        if (Buffer.byteLength(body, "utf8") > maxRequestBytes) {
            throw new Error("Order details are too large.");
        }
    }

    try {
        return JSON.parse(body);
    } catch {
        throw new Error("Order details were not valid JSON.");
    }
}

function isRateLimited(request) {
    const forwardedFor = request.headers["x-forwarded-for"];
    const clientAddress = typeof forwardedFor === "string"
        ? forwardedFor.split(",")[0].trim()
        : request.socket.remoteAddress || "unknown";
    const now = Date.now();
    const previous = rateLimits.get(clientAddress) || [];
    const recent = previous.filter(timestamp => now - timestamp < 60_000);

    if (recent.length >= 5) {
        rateLimits.set(clientAddress, recent);
        return true;
    }

    recent.push(now);
    rateLimits.set(clientAddress, recent);
    return false;
}

function validateOrder(body) {
    const customer = body?.customer;

    if (!customer || typeof customer !== "object" || Array.isArray(customer)) {
        return { error: "Please provide your contact and delivery details." };
    }

    if (typeof customer.website === "string" && customer.website.trim()) {
        return { error: "The order could not be accepted." };
    }

    if (!isText(customer.name, 100)) {
        return { error: "Enter your name (up to 100 characters)." };
    }

    if (
        !isText(customer.email, 254) ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email.trim())
    ) {
        return { error: "Enter a valid email address." };
    }

    if (!isText(customer.phone, 40)) {
        return { error: "Enter a phone number (up to 40 characters)." };
    }

    if (!isText(customer.address, 500)) {
        return { error: "Enter a delivery address (up to 500 characters)." };
    }

    if (!Array.isArray(body.items) || body.items.length === 0 || body.items.length > 30) {
        return { error: "Your cart is empty or contains too many items." };
    }

    const quantities = new Map();

    for (const item of body.items) {
        if (
            !item ||
            !Number.isInteger(item.id) ||
            !products.has(item.id) ||
            !Number.isInteger(item.quantity) ||
            item.quantity < 1 ||
            item.quantity > 99
        ) {
            return { error: "Your cart contains an invalid product or quantity." };
        }

        quantities.set(item.id, (quantities.get(item.id) || 0) + item.quantity);
    }

    const items = [...quantities].map(([id, quantity]) => ({
        ...products.get(id),
        quantity
    }));
    const subtotal = items.reduce((total, item) => total + item.price * item.quantity, 0);

    return {
        customer: {
            name: customer.name.trim(),
            email: customer.email.trim(),
            phone: customer.phone.trim(),
            address: customer.address.trim()
        },
        items,
        subtotal
    };
}

function createOrderEmail(order, orderId) {
    const rows = order.items.map(item => {
        const lineTotal = new Intl.NumberFormat("en-AU", {
            style: "currency",
            currency: "AUD"
        }).format(item.price * item.quantity);
        const name = escapeHtml(item.name);

        return `<tr><td>${name}</td><td>${item.quantity}</td><td>${lineTotal}</td></tr>`;
    }).join("");
    const subtotal = new Intl.NumberFormat("en-AU", {
        style: "currency",
        currency: "AUD"
    }).format(order.subtotal);
    const customer = Object.fromEntries(
        Object.entries(order.customer).map(([key, value]) => [key, escapeHtml(value)])
    );

    return {
        subject: `New Nexus Bike order request ${orderId}`,
        text: [
            `Order request: ${orderId}`,
            "",
            `Name: ${order.customer.name}`,
            `Email: ${order.customer.email}`,
            `Phone: ${order.customer.phone}`,
            `Delivery address: ${order.customer.address}`,
            "",
            "Items:",
            ...order.items.map(item =>
                `${item.name} x ${item.quantity} — $${(item.price * item.quantity).toFixed(2)} AUD`
            ),
            "",
            `Subtotal: $${order.subtotal.toFixed(2)} AUD`,
            "Shipping and final pricing have not been confirmed."
        ].join("\n"),
        html: `
            <h1>New order request</h1>
            <p><strong>Reference:</strong> ${orderId}</p>
            <h2>Customer details</h2>
            <p><strong>Name:</strong> ${customer.name}<br>
            <strong>Email:</strong> ${customer.email}<br>
            <strong>Phone:</strong> ${customer.phone}<br>
            <strong>Delivery address:</strong><br>${customer.address.replace(/\n/g, "<br>")}</p>
            <h2>Items</h2>
            <table border="1" cellpadding="8" cellspacing="0">
                <thead><tr><th>Product</th><th>Quantity</th><th>Line total</th></tr></thead>
                <tbody>${rows}</tbody>
                <tfoot><tr><th colspan="2">Subtotal (AUD)</th><th>${subtotal}</th></tr></tfoot>
            </table>
            <p>Shipping and final pricing have not been confirmed. No payment was taken.</p>
        `
    };
}

async function sendOrderEmail(order, orderId) {
    const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            from: orderFromEmail,
            to: [orderToEmail],
            reply_to: order.customer.email,
            ...createOrderEmail(order, orderId)
        })
    });

    if (!response.ok) {
        const details = await response.text();
        console.error(
            `Nexus Bike: Resend rejected order ${orderId} with HTTP ${response.status}: ${details}`
        );
        return false;
    }

    return true;
}

async function handleOrder(request, response) {
    if (request.method !== "POST") {
        sendJson(response, 405, { error: "Use POST to submit an order." });
        return;
    }

    if (!resendApiKey || !orderToEmail || !orderFromEmail) {
        console.error("Nexus Bike: Set RESEND_API_KEY, ORDER_TO_EMAIL, and ORDER_FROM_EMAIL.");
        sendJson(response, 503, { error: "Order email is not configured yet." });
        return;
    }

    if (isRateLimited(request)) {
        sendJson(response, 429, { error: "Too many order attempts. Please try again shortly." });
        return;
    }

    let body;

    try {
        body = await readJson(request);
    } catch (error) {
        const isTooLarge = error instanceof Error && error.message === "Order details are too large.";
        sendJson(response, isTooLarge ? 413 : 400, {
            error: error instanceof Error ? error.message : "Order details could not be read."
        });
        return;
    }

    const order = validateOrder(body);

    if (order.error) {
        sendJson(response, 400, { error: order.error });
        return;
    }

    const orderId = randomUUID().slice(0, 8).toUpperCase();

    try {
        const sent = await sendOrderEmail(order, orderId);

        if (!sent) {
            sendJson(response, 502, { error: "The email service could not send your order. Please try again." });
            return;
        }
    } catch (error) {
        console.error(`Nexus Bike: Failed to send order ${orderId}.`, error);
        sendJson(response, 502, { error: "The email service could not be reached. Please try again." });
        return;
    }

    sendJson(response, 200, { success: true, orderId });
}

const publicFiles = new Map([
    ["/", ["index.html", "text/html; charset=utf-8"]],
    ["/index.html", ["index.html", "text/html; charset=utf-8"]],
    ["/style.css", ["style.css", "text/css; charset=utf-8"]],
    ["/script.js", ["script.js", "text/javascript; charset=utf-8"]]
]);

const server = createServer(async (request, response) => {
    const requestUrl = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);

    if (requestUrl.pathname === "/api/orders") {
        await handleOrder(request, response);
        return;
    }

    if (request.method !== "GET" && request.method !== "HEAD") {
        sendJson(response, 405, { error: "Method not allowed." });
        return;
    }

    const file = publicFiles.get(requestUrl.pathname);

    if (!file) {
        sendJson(response, 404, { error: "Not found." });
        return;
    }

    try {
        const contents = await readFile(path.join(root, file[0]));
        response.writeHead(200, {
            "Content-Type": file[1],
            "Cache-Control": "no-store",
            "X-Content-Type-Options": "nosniff"
        });
        response.end(request.method === "HEAD" ? undefined : contents);
    } catch (error) {
        console.error(`Nexus Bike: Could not read ${file[0]}.`, error);
        sendJson(response, 500, { error: "The page could not be loaded." });
    }
});

server.listen(port, () => {
    console.log(`Nexus Bike is running at http://localhost:${port}`);
});
