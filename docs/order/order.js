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
  const orderSummary = document.getElementById("orderSummary");
  const orderForm = document.getElementById("orderForm");
  const successOverlay = document.getElementById("successOverlay");
  const successDetail = document.getElementById("successDetail");

  const pricingTiers = [
    { min: 1, max: 4, price: 14, label: "$14 / bag" },
    { min: 5, max: 9, price: 10, label: "$10 / bag" },
    { min: 10, max: 19, price: 9, label: "$9 / bag" },
    { min: 20, max: Number.POSITIVE_INFINITY, price: null, label: "Wholesale quote" },
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
    const isWholesale = pricing.price === null;

    updateTierState(quantity);
    renderAddons(selectedAddons);

    sumQty.textContent = `× ${quantity}`;
    priceDisplay.textContent = pricing.price === null ? "Quote" : `$${pricing.price}`;
    sumPerBag.textContent = pricing.label;

    if (isWholesale) {
      totalPrice.textContent = `Quote + $${addonTotal}`;
    } else {
      totalPrice.textContent = `$${pricing.price * quantity + addonTotal}`;
    }

    orderSummary.classList.toggle("is-wholesale", isWholesale);
  }

  qtyDec?.addEventListener("click", () => setQuantity(getQuantity() - 1));
  qtyInc?.addEventListener("click", () => setQuantity(getQuantity() + 1));

  tiers.forEach((tier) => {
    tier.addEventListener("click", () => {
      setQuantity(Number(tier.dataset.qty || 1));
    });
  });

  addonChecks.forEach((addon) => {
    addon.addEventListener("change", updateOrderSummary);
  });

  deliveryOptions.forEach((option) => {
    const input = option.querySelector('input[name="delivery"]');
    option.addEventListener("click", () => {
      if (input) {
        input.checked = true;
      }

      deliveryOptions.forEach((item) => item.classList.remove("selected"));
      option.classList.add("selected");
      updateOrderSummary();
    });
  });

  orderForm?.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!orderForm.reportValidity()) {
      return;
    }

    const quantity = getQuantity();
    const pricing = getPricing(quantity);
    const addonText = getSelectedAddons()
      .map((addon) => addon.label)
      .join(", ");

    successDetail.innerHTML = `
      <div class="success-detail-row"><span>Name</span><strong>${document.getElementById("fname").value.trim()}</strong></div>
      <div class="success-detail-row"><span>Order</span><strong>${quantity} bag${quantity === 1 ? "" : "s"}</strong></div>
      <div class="success-detail-row"><span>Delivery</span><strong>${getDeliveryLabel()}</strong></div>
      <div class="success-detail-row"><span>Pricing</span><strong>${pricing.label}</strong></div>
      <div class="success-detail-row"><span>Add-Ons</span><strong>${addonText || "None"}</strong></div>
    `;

    successOverlay.hidden = false;
  });

  successOverlay?.addEventListener("click", (event) => {
    if (event.target === successOverlay) {
      successOverlay.hidden = true;
    }
  });

  updateOrderSummary();
});
