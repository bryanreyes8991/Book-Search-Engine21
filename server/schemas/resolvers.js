const { User, Book } = require('../models');
const { signToken, AuthenticationError } = require('../utils/auth')

const resolvers = {
    Query: {
        me: async (parent, args, context) => {
        if (context.user) {
            return User.findOne({ _id: context.user._id }).populate('savedBooks');
        }
        throw AuthenticationError;
        },
    },
    Mutation: {
        login: async (parent, { email, password }) => {
            const user = await User.findOne({ email });

            if (!user) {
                throw AuthenticationError;
            }
            const correctPw = await user.isCorrectPassword(password);
            if (!correctPw) {
                throw AuthenticationError;
            }
            const token = signToken(user);
            return { token, user };
        },
        addUser: async (parent, { username, email, password }) => {
            const user = await User.create({ username, email, password });
            const token = signToken(user);
            return { token, user };
        },
        addBook: async (parent, { BookId }, context) => {
          if (context.user) {
            return await Book.findOneAndUpdate(
                { _id: context.user._id },
                { $addToSet: {savedBooks: Book.bookId} }
            );
          }
          throw AuthenticationError;
        },
        removeBook: async (parent, { bookId }, context) => {
            if (context.user) {
                const book = await Book.findOneAndDelete({
                    _id: bookId
                });
                await User.findOneAndUpdate(
                    { _id: context.user._id },
                    { $pull: { savedBooks: book.bookId } }
                );
                return book;
            }
            throw AuthenticationError;
        },
    },
};

module.exports = resolvers;