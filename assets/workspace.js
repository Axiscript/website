(function () {
  var FUSION = "Fusion (butt / saddle / electrofusion)";
  var cardsEl = document.getElementById("workspace-cards");
  if (!cardsEl) return;

  var sector = "transmission";
  var material = "steel";

  function cardsFor(sector, material) {
    var steel = material === "steel" || material === "both";
    var poly = material === "poly" || material === "both";
    var list;

    if (sector === "distribution") {
      list = ["Service install", "Service renewal", "Main install", "Bore / HDD"];
      if (poly) list.push(FUSION);
      if (steel) list.push("Welding");
      list.push("Mole-shot service", "Box-out over main", "Pressure test", "Restoration");
      return list;
    }

    list = [
      "Clearing & Grading",
      material === "poly" ? "Stringing" : "Stringing & Bending"
    ];
    if (steel) list.push("Welding & NDE");
    if (poly) list.push(FUSION);
    if (steel) list.push("Coating");
    list.push("Lowering-In");
    if (sector === "transmission") list.push("Road / water crossing");
    if (sector === "midstream") {
      list.push("Gathering line", "Well pad / meter skid hookup");
    }
    list.push("Backfill & Restoration");
    list.push(sector === "midstream" ? "Pressure test / Hydrotest" : "Hydrotest");
    return list;
  }

  function render() {
    var items = cardsFor(sector, material);
    cardsEl.replaceChildren();
    items.forEach(function (name) {
      var li = document.createElement("li");
      li.textContent = name;
      cardsEl.appendChild(li);
    });
  }

  function press(group, attr, value) {
    group.querySelectorAll("[" + attr + "]").forEach(function (btn) {
      btn.setAttribute("aria-pressed", String(btn.getAttribute(attr) === value));
    });
  }

  document.querySelectorAll("[data-sector]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      sector = btn.getAttribute("data-sector");
      press(btn.parentElement, "data-sector", sector);
      render();
    });
  });

  document.querySelectorAll("[data-material]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      material = btn.getAttribute("data-material");
      press(btn.parentElement, "data-material", material);
      render();
    });
  });

  render();
})();
