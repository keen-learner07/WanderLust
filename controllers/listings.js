const Listing = require("../models/listing.js");
const { cloudinary } = require("../cloudConfig");

const categoryMap = {
  Mountain: "Mountains",
  Beach: "Beaches",
  Farm: "Farms",
  City: "Cities",
  Countryside: "Countryside",
  Manor: "Manors",
  Boathouse: "Boathouses",
  Arctic: "Arctic",
  Camping: "Camping",
  Forest: "Forests",
  Dome: "Domes",
};

module.exports.index = async (req, res) => {
  const { query: searchQuery, category } = req.query;
  let filter = {};

  if (searchQuery) {
    filter.$or = [
      { title: { $regex: searchQuery, $options: "i" } },
      { location: { $regex: searchQuery, $options: "i" } },
      { country: { $regex: searchQuery, $options: "i" } },
    ];
  }

  if (category) {
    filter.category = category;
  }

  const listings = await Listing.find(filter);

  if (listings.length === 0 && (searchQuery || category)) {
    const displayCategory = category ? categoryMap[category] : "";

    if (searchQuery && category) {
      req.flash(
        "error",
        `No listings found matching "${searchQuery}" in the category "${displayCategory}"`
      );
    } else if (searchQuery) {
      req.flash("error", `No listings found matching "${searchQuery}"`);
    } else if (category) {
      req.flash(
        "error",
        `No listings found in the category "${displayCategory}"`
      );
    }
    return res.redirect("/listings");
  }

  res.render("listings/index.ejs", {
    allListings: listings,
    showSearch: true,
    category,
  });
};

module.exports.renderNewForm = (req, res) => {
  res.render("listings/new.ejs");
};

module.exports.showListings = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id)
    .populate({
      path: "reviews",
      populate: {
        path: "author",
      },
    })
    .populate("owner");
  if (!listing) {
    req.flash("error", "The listing you requested isn't available!");
    return res.redirect("/listings");
  }
  res.render("listings/show.ejs", { listing });
};

module.exports.createListing = async (req, res) => {
  let address = req.body.listing.location;
  let response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      address
    )}`,
    {
      headers: {
        "User-Agent": "WanderLust (duakhushi08@gmail.com)",
      },
    }
  );
  const data = await response.json();

  if (!data || data.length === 0) {
    req.flash("error", "Invalid location!");
    return res.redirect("/listings/new");
  }

  const coordinates = [data[0].lon, data[0].lat];

  const newListing = new Listing(req.body.listing);
  newListing.owner = req.user._id;
  newListing.geometry = { type: "Point", coordinates };
  newListing.image = req.body.listing.image;

  await newListing.save();
  req.flash("success", "New Listing Created!");
  res.redirect("/listings");
};

module.exports.renderEditForm = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "The listing you requested isn't available!");
    return res.redirect("/listings");
  }

  let originalImageUrl = listing.image.url;
  let editedImageUrl = originalImageUrl.replace("/upload", "/upload/w_250");

  res.render("listings/edit.ejs", { listing, editedImageUrl });
};

module.exports.updateListing = async (req, res) => {
  try {
    const { id } = req.params;
    const newAddress = req.body.listing.location;

    const prevListing = await Listing.findById(id);
    if (!prevListing) {
      req.flash("error", "Listing not found!");
      return res.redirect("/listings");
    }

    let geometryUpdate = {};

    if (newAddress && newAddress !== prevListing.location) {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          newAddress
        )}`,
        {
          headers: {
            "User-Agent": "WanderLust (duakhushi08@gmail.com)",
          },
        }
      );

      const data = await response.json();
      if (data && data.length > 0) {
        const coordinates = [data[0].lon, data[0].lat];
        geometryUpdate.geometry = { type: "Point", coordinates };
      }
    }

    const updateData = { ...req.body.listing, ...geometryUpdate };

    if (req.body.listing.image && req.body.listing.image.url) {
      updateData.image = req.body.listing.image;
    }

    await Listing.findByIdAndUpdate(id, updateData);

    req.flash("success", "Listing Updated!");
    res.redirect(`/listings/${id}`);
  } catch (err) {
    console.error(err);
    req.flash("error", "Something went wrong while updating the listing!");
    res.redirect("/listings");
  }
};

module.exports.destroyListing = async (req, res) => {
  let { id } = req.params;

  const listing = await Listing.findById(id);

  if (listing.image && listing.image.filename) {
    await cloudinary.uploader.destroy(listing.image.filename);
  }

  await Listing.findByIdAndDelete(id);
  req.flash("success", "Listing Deleted!");
  res.redirect("/listings");
};
