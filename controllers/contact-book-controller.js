const mongoose = require("mongoose");
const HttpError = require("../models/http-error");
const User = require("../models/user-model");
const Contact = require("../models/contact-model");

const getAllContacts = async (req, res, next) => {
  const userId = req.params.uid; // instead of params we can get userid from userData attached to request at check-auth middleware
  if (!userId) {
    const error = new HttpError("user id is missing. Please provide one.", 404);
    return next(error);
  }
  try {
    const user = User.findById(userId);
    if (!user) {
      const error = new HttpError(
        "Invlalid userid passed. Please provide one.",
        404
      );
      return next(error);
    }
    const contacts = await Contact.find({ userId: userId }).exec();
    return res
      .status(202)
      .json({ contacts: contacts.map((c) => c.toObject({ getters: true })) });
  } catch (err) {
    const error = new HttpError(
      "Something went wrong on the server, couldn't get contacts.",
      500
    );
    return next(error);
  }
};
const addContact = async (req, res, next) => {
  const userId = req.userData.userId;
  const { name, phone, address, about, relation } = req.body;

  console.log("userID: " + userId);

  if (!name || !phone || !address || !about || !relation) {
    const error = new HttpError(
      "Some of all of the contact info is missing.",
      301
    );
    return next(error);
  }
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const user = await User.findById(userId).session(session).exec();
    const newContact = new Contact({
      name,
      phone,
      address,
      about,
      relation,
      userId,
    });
    await newContact.save({ session });

    user.contactsList.push(newContact._id);
    await user.save({ session });

    await session.commitTransaction();

    res.status(202).json({
      message: "Contact Added Successfully!",
      contact: newContact.toObject({ getters: true }),
    });
  } catch (err) {
    session.abortTransaction();
    const error = new HttpError(
      "Something went wrong, could not add contact: " + err.message,
      505
    );
    return next(error);
  } finally {
    session.endSession();
  }
};
const editContact = async (req, res, next) => {
  const contactId = req.params.cid;
  const userId = req.userData.userId;
  const { name, phone, address, about, relation } = req.body;
  if (!name || !phone || !address || !about || !relation) {
    const error = new HttpError("Some or all values are missing...", 404);
    return next(error);
  }
  if (!contactId) {
    const error = new HttpError("contact id is missing", 404);
    return next(error);
  }
  try {
    const updatedContact = await Contact.findById({ _id: contactId }).exec();
    if (!updatedContact) {
      const error = new HttpError(
        "can't update contact, invalid contact id passed",
        404
      );
      return next(error);
    }
    updatedContact.name = name;
    updatedContact.phone = phone;
    updatedContact.address = address;
    updatedContact.about = about;
    updatedContact.relation = relation;

    await updatedContact.save();

    return res
      .status(202)
      .json({ updatedContact: updatedContact.toObject({ getters: true }) });
  } catch (err) {
    const error = new HttpError("Error updating contact: " + err.message, 500);
    return next(error);
  }
};
const deleteContact = async (req, res, next) => {
  const contactId = req.params.cid;
  const userId = req.userData.userId;
  if (!contactId) {
    const error = new HttpError("Missing Contact id.", 404);
    return next(error);
  }
  const session = await mongoose.startSession();
  await session.startTransaction();
  try {
    let user = await User.findById(userId).session({ session }).exec();
    const contact = await Contact.findById(contactId)
      .session({ session })
      .exec();

    if (!contact) {
      throw new Error("Invalid contact id passed.", 404);
    }

    await Contact.findOneAndDelete(contactId).session(session);
    user = await User.findByIdAndUpdate(
      userId,
      { $pull: { contactsList: contactId } },
      { session }
    );
    session.commitTransaction();
  } catch (err) {
    session.abortTransaction();
    const error = new HttpError(
      "Something went wrong, Can't Delete Contact: " + err.message,
      404
    );
    return next(error);
  } finally {
    session.endSession();
  }
};

exports.getAllContacts = getAllContacts;
exports.addContact = addContact;
exports.editContact = editContact;
exports.deleteContact = deleteContact;
