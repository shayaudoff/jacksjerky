document.addEventListener("DOMContentLoaded", () => {
  const qtyDisplay = document.getElementById("qtyDisplay");
  const priceDisplay = document.getElementById("priceDisplay");
  const qtyDec = document.getElementById("qtyDec");
  const qtyInc = document.getElementById("qtyInc");
  const tiers = Array.from(document.querySelectorAll(".tier"));
  const addonChecks = Array.from(document.querySelectorAll(".addon-check"));
  const deliveryOptions = Array.from(document.querySelectorAll(".delivery-option"));
  const sumQty = document.getElementById("sumQty");
  const sumPerBag = document.getElementById("sumPerBag");
  const sumAddons = document.getElementById("sumAddons");
  const totalPrice = document.getElementById("totalPrice");
  const orderForm = document.getElementById("orderForm");
  const successOverlay = document.getElementById("successOverlay");
  const successDetail = document.getElementById("successDetail");
  const formStatus = document.getElementById("formStatus");
  const shippingAddressField = document.getElementById("shippingAddressField");
  const shippingStateField = document.getElementById("shippingStateField");
  const shippingRequiredLabels = Array.from(document.querySelectorAll(".shipping-required"));

  const EMAILJS_PUBLIC_KEY = "vaKSM9weRLDJcMVac";
  const EMAILJS_SERVICE_ID = "service_e3thr3k";
  const EMAILJS_TEMPLATE_ID = "template_nf80lkp";
  let emailJsPromise;

  function loadEmailJs() {
    if (emailJsPromise) {
      return emailJsPromise;
    }

    emailJsPromise = new Promise((resolve, reject) => {
      if (window.emailjs) {
        window.emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
        resolve(window.emailjs);
        return;
      }

      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js";
      script.onload = () => {
        if (!window.emailjs) {
          reject(new Error("EmailJS failed to load."));
          return;
        }

        window.emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
        resolve(window.emailjs);
      };
      script.onerror = () => reject(new Error("EmailJS script could not be loaded."));
      document.head.appendChild(script);
    });

    return emailJsPromise.catch((error) => {
      emailJsPromise = undefined;
      throw error;
    });
  }

  function getFieldValue(id) {
    return document.getElementById(id)?.value?.trim() || "";
  }

  function getOrderTotalText(quantity, pricing, addonTotal) {
    return `$${pricing.price * quantity + addonTotal}`;
  }

  const pricingTiers = [
    { min: 1, max: Number.POSITIVE_INFINITY, price: 10, label: "$10 / bag" },
  ];

  function getQuantity() {
    return Number(qtyDisplay.textContent) || 1;
  }

  function setQuantity(nextQty) {
    const quantity = Math.max(1, Math.min(99, nextQty));
    qtyDisplay.textContent = String(quantity);
    updateOrderSummary();
  }

  function getPricing(quantity) {
    return pricingTiers.find((tier) => quantity >= tier.min && quantity <= tier.max);
  }

  function getAddonTotal() {
    return addonChecks.reduce((total, addon) => {
      return addon.checked ? total + Number(addon.dataset.price || 0) : total;
    }, 0);
  }

  function getSelectedAddons() {
    return addonChecks
      .filter((addon) => addon.checked)
      .map((addon) => ({
        label: addon.dataset.label || "Add-On",
        price: Number(addon.dataset.price || 0),
      }));
  }

  function getDeliveryLabel() {
    const selected = document.querySelector('input[name="delivery"]:checked');
    if (!selected) {
      return "Local Pickup";
    }

    const option = selected.closest(".delivery-option");
    return option?.querySelector(".delivery-name")?.textContent?.trim() || selected.value;
  }

  function getDeliveryValue() {
    return document.querySelector('input[name="delivery"]:checked')?.value || "pickup";
  }

  function updateDeliveryFields() {
    const isShipping = getDeliveryValue() === "ship";
    const addressInput = document.getElementById("faddress");
    const stateInput = document.getElementById("fstate");
    const cityInput = document.getElementById("fcity");
    const zipInput = document.getElementById("fzip");

    if (shippingAddressField) shippingAddressField.hidden = !isShipping;
    if (shippingStateField) shippingStateField.hidden = !isShipping;
    shippingRequiredLabels.forEach((label) => { label.hidden = !isShipping; });
    [addressInput, stateInput, cityInput, zipInput].forEach((input) => {
      if (input) input.required = isShipping;
    });
  }

  function setFormStatus(message, type = "") {
    if (!formStatus) return;
    formStatus.textContent = message;
    formStatus.className = `form-status${type ? ` is-${type}` : ""}`;
  }

  function makeOrderNumber() {
    const datePart = new Date().toISOString().slice(0, 10).replaceAll("-", "");
    const randomPart = Math.random().toString(36).slice(2, 7).toUpperCase();
    return `JJ-${datePart}-${randomPart}`;
  }

  function formatAddon(addon) {
    return `${addon.label} (${addon.price > 0 ? `+$${addon.price}` : "Free"})`;
  }

  function buildOrderDetails(data) {
    const lines = [
      `ORDER REQUEST ${data.order_number}`,
      `Submitted: ${data.submitted_at}`,
      "",
      "CUSTOMER",
      `Name: ${data.customer_name}`,
      `Phone / WhatsApp: ${data.customer_phone}`,
      `Email: ${data.customer_email || "Not provided"}`,
      `City: ${data.city || "Not provided"}`,
      `ZIP: ${data.zip_code || "Not provided"}`,
      "",
      "ORDER",
      `Product: The Original Jack's`,
      `Quantity: ${data.bags_text}`,
      `Price per bag: ${data.price_per_bag}`,
      `Merchandise subtotal: ${data.item_subtotal}`,
      `Add-ons: ${data.addons}`,
      `Add-on total: ${data.addons_total}`,
      `Estimated total: ${data.total}`,
      `Shipping charge: ${data.shipping_cost}`,
      "",
      "FULFILLMENT",
      `Delivery method: ${data.delivery_method}`,
      `Shipping address: ${data.full_address || "Not applicable"}`,
      "",
      "EXTRA INFORMATION",
      `Occasion: ${data.occasion || "Not provided"}`,
      `Heard about us: ${data.referral_source || "Not provided"}`,
      `Notes / special requests: ${data.customer_notes || "None"}`,
    ];

    return lines.join("\n");
  }

  function addSuccessRow(label, value) {
    const row = document.createElement("div");
    const rowLabel = document.createElement("span");
    const rowValue = document.createElement("strong");
    row.className = "success-detail-row";
    rowLabel.textContent = label;
    rowValue.textContent = value;
    row.append(rowLabel, rowValue);
    successDetail?.appendChild(row);
  }

  function renderAddons(selectedAddons) {
    sumAddons.innerHTML = "";

    if (!selectedAddons.length) {
      const empty = document.createElement("p");
      empty.className = "summary-empty";
      empty.textContent = "No add-ons selected.";
      sumAddons.appendChild(empty);
      return;
    }

    selectedAddons.forEach((addon) => {
      const row = document.createElement("div");
      row.className = "summary-row summary-addon-row";
      row.innerHTML = `<span>${addon.label}</span><span>${addon.price > 0 ? `+$${addon.price}` : "Free"}</span>`;
      sumAddons.appendChild(row);
    });
  }

  function updateTierState(quantity) {
    tiers.forEach((tier) => {
      const tierQty = Number(tier.dataset.qty || 1);
      const nextTier = tiers.find((candidate) => Number(candidate.dataset.qty) > tierQty);
      const upperBound = nextTier ? Number(nextTier.dataset.qty) - 1 : Number.POSITIVE_INFINITY;
      const isActive = quantity >= tierQty && quantity <= upperBound;

      tier.classList.toggle("selected", isActive);
    });
  }

  function updateOrderSummary() {
    const quantity = getQuantity();
    const pricing = getPricing(quantity);
    const selectedAddons = getSelectedAddons();
    const addonTotal = getAddonTotal();
    updateTierState(quantity);
    renderAddons(selectedAddons);

    sumQty.textContent = `× ${quantity}`;
    priceDisplay.textContent = `$${pricing.price}`;
    sumPerBag.textContent = pricing.label;
    totalPrice.textContent = `$${pricing.price * quantity + addonTotal}`;
  }

  qtyDec?.addEventListener("click", () => setQuantity(getQuantity() - 1));
  qtyInc?.addEventListener("click", () => setQuantity(getQuantity() + 1));

  tiers.forEach((tier) => {
    const selectTier = () => {
      setQuantity(Number(tier.dataset.qty || 1));
    };
    tier.addEventListener("click", selectTier);
    tier.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        selectTier();
      }
    });
  });

  addonChecks.forEach((addon) => {
    addon.addEventListener("change", updateOrderSummary);
  });

  deliveryOptions.forEach((option) => {
    const input = option.querySelector('input[name="delivery"]');
    const selectDelivery = () => {
      deliveryOptions.forEach((item) => item.classList.remove("selected"));
      option.classList.add("selected");
      updateDeliveryFields();
      updateOrderSummary();
    };

    option.addEventListener("click", () => {
      if (input) {
        input.checked = true;
      }
      selectDelivery();
    });
    input?.addEventListener("change", selectDelivery);
  });

  orderForm?.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!orderForm.reportValidity()) {
      setFormStatus("Please complete the required fields before sending.", "error");
      return;
    }

    if (getFieldValue("fwebsite")) {
      orderForm.reset();
      return;
    }

    const submitButton = orderForm.querySelector('button[type="submit"]');
    const originalButtonText = submitButton?.textContent?.trim() || "Send Order Request →";
    const quantity = getQuantity();
    const pricing = getPricing(quantity);
    const selectedAddons = getSelectedAddons();
    const addonTotal = getAddonTotal();
    const addonText = selectedAddons.map(formatAddon).join(", ");
    const deliveryLabel = getDeliveryLabel();
    const isShipping = getDeliveryValue() === "ship";
    const totalText = getOrderTotalText(quantity, pricing, addonTotal);
    const itemSubtotal = `$${pricing.price * quantity}`;
    const addressParts = [getFieldValue("faddress"), getFieldValue("fcity"), getFieldValue("fstate"), getFieldValue("fzip")].filter(Boolean);

    const orderData = {
      order_number: makeOrderNumber(),
      submitted_at: new Date().toLocaleString("en-US", { dateStyle: "long", timeStyle: "short" }),
      customer_name: getFieldValue("fname"),
      customer_email: getFieldValue("femail"),
      customer_phone: getFieldValue("fphone"),
      reply_to: getFieldValue("femail"),
      city: getFieldValue("fcity"),
      state: isShipping ? getFieldValue("fstate") : "",
      zip_code: getFieldValue("fzip"),
      shipping_address: isShipping ? getFieldValue("faddress") : "",
      full_address: isShipping ? addressParts.join(", ") : "",
      referral_source: getFieldValue("fhear"),
      occasion: getFieldValue("foccasion"),
      customer_notes: getFieldValue("fnotes"),
      quantity,
      bags_text: `${quantity} bag${quantity === 1 ? "" : "s"}`,
      delivery_method: deliveryLabel,
      price_per_bag: pricing.label,
      addons: addonText || "None",
      addons_total: `$${addonTotal}`,
      item_subtotal: itemSubtotal,
      total: totalText,
      shipping_cost: isShipping ? "Quoted separately (not included in estimated total)" : "Not applicable",
      subject: `New Jack's Jerky order ${quantity} bag${quantity === 1 ? "" : "s"}`,
    };
    orderData.order_details = buildOrderDetails(orderData);
    orderData.message = orderData.order_details;

    try {
      setFormStatus("Sending your order request…", "sending");
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "Sending...";
      }

      const emailjs = await loadEmailJs();
      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, orderData);

      successDetail.replaceChildren();
      addSuccessRow("Order #", orderData.order_number);
      addSuccessRow("Name", orderData.customer_name);
      addSuccessRow("Order", orderData.bags_text);
      addSuccessRow("Delivery", orderData.delivery_method);
      addSuccessRow("Pricing", orderData.price_per_bag);
      addSuccessRow("Add-Ons", orderData.addons);
      addSuccessRow("Total", orderData.total);

      successOverlay.hidden = false;
      orderForm.reset();
      addonChecks.forEach((addon) => { addon.checked = false; });
      deliveryOptions.forEach((item) => {
        const radio = item.querySelector('input[name="delivery"]');
        if (radio) radio.checked = radio.value === "pickup";
      });
      deliveryOptions.forEach((item) => item.classList.remove("selected"));
      deliveryOptions[0]?.classList.add("selected");
      updateDeliveryFields();
      setQuantity(1);
      setFormStatus("");
    } catch (error) {
      console.error("EmailJS order send failed:", error);
      setFormStatus("The order could not be sent. Please check your connection and try again.", "error");
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
      }
    }
  });

  successOverlay?.addEventListener("click", (event) => {
    if (event.target === successOverlay) {
      successOverlay.hidden = true;
    }
  });

  updateDeliveryFields();
  updateOrderSummary();
});
