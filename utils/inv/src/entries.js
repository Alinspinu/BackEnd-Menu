// entries.js
const { round } = require("./utils");
const logger = require("./logger");

// Get oldest stock entry by date
function getOldestEntry(entries) {
  if (!entries.length) return null;

  return entries.reduce((oldest, current) =>
    new Date(current.date).getTime() < new Date(oldest.date).getTime()
      ? current
      : oldest
  );
}

// FIFO subtract logic
function subtractFromEntries(entries, qtyToSubtract) {
  logger.debug("FIFO subtract:", qtyToSubtract);

  // Sort from oldest to newest
  entries.sort((a, b) => new Date(a.date) - new Date(b.date));

  let remaining = qtyToSubtract;

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const isLast = i === entries.length - 1;

    if (remaining <= 0) break;

    if (entry.qty >= remaining) {
      // Enough quantity in this entry
      entry.qty = round(entry.qty - remaining);

      if (entry.qty === 0 && !isLast) {
        entries.splice(i, 1);
        i--;
      }

      remaining = 0;
    } else {
      // Not enough quantity → consume entire entry
      remaining -= entry.qty;

      if (!isLast) {
        entries.splice(i, 1);
        i--;
      } else {
        // Last entry goes negative — preserve logic
        entry.qty = round(entry.qty - remaining);
        remaining = 0;
      }
    }
  }

  return entries;
}

// FIFO add logic (increase oldest entry)
function addToEntries(entries, qty, priceNoVat, priceWithVat, inQty, supplier = "Internal Production") {
  logger.debug("FIFO add:", qty);

  if (!entries.length) {
    return [{
      qty: round(qty),
      inQty: round(inQty),
      date: new Date(),
      priceNoVat,
      priceWithVat,
      suplierName: supplier
    }];
  }

  const oldest = getOldestEntry(entries);
  if (!oldest) return entries;

  const index = entries.findIndex(e => e._id && oldest._id && e._id.toString() === oldest._id.toString());

  if (index !== -1) {
    entries[index].qty = round(entries[index].qty + qty);
    entries[index].date = new Date();
  }

  return entries;
}

module.exports = {
  subtractFromEntries,
  addToEntries,
  getOldestEntry
};