const nf = new Intl.NumberFormat("fr-MA", {
    numberingSystem: "latn",
    style: "currency",
    currency: "MAD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
});

export const formatPrice = (price: number) => {
    return nf.format(price).replace("MAD", "درهم");
};

export const formatNumber = (num: number) => {
    return new Intl.NumberFormat("fr-MA", { numberingSystem: "latn" }).format(num);
};
