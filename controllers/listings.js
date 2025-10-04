const Listing = require("../models/listing.js");

module.exports.index = async (req, res) => {
  const allListings = await Listing.find({});
  res.render("listings/index.ejs", { allListings, showSearch: true });
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
  const coordinates = [data[0].lon, data[0].lat];

  let url = req.file.path;
  let filename = req.file.filename;

  const newListing = new Listing(req.body.listing);
  newListing.owner = req.user._id;
  newListing.image = { url, filename };
  newListing.geometry = { type: "Point", coordinates };
  let savedListing = await newListing.save();
  console.log(savedListing);
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
  let { id } = req.params;
  let newAddress = req.body.listing.location;

  let prevListing = await Listing.findById(id);

  let geometryUpdate = {};

  if (newAddress !== prevListing.location) {
    let response = await fetch(
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
    const coordinates = [data[0].lon, data[0].lat];

    geometryUpdate.geometry = { type: "Point", coordinates };
  }

  let newListing = await Listing.findByIdAndUpdate(id, {
    ...req.body.listing,
    ...geometryUpdate,
  });

  if (typeof req.file != "undefined") {
    let url = req.file.path;
    let filename = req.file.filename;
    newListing.image = { url, filename };
    await newListing.save();
  }

  req.flash("success", "Listing Updated!");
  res.redirect(`/listings/${id}`);
};

module.exports.destroyListing = async (req, res) => {
  let { id } = req.params;
  await Listing.findByIdAndDelete(id);
  req.flash("success", "Listing Deleted!");
  res.redirect("/listings");
};
