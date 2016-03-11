module.exports = {
    // Flat:
    TEXT: 1,
    TAG: 2,
    OPEN_TAG: 3,
    CLOSE_TAG: 4,

    // AST:
    NODE_ENTER: 5,
    NODE_EXIT: 6,
    NODE: 7,

    // Structure:
    LEFT_EARLIER: -1,
    LEFT_HIGHER: -1,
    EQUAL: 0,
    RIGHT_EARLIER: 1,
    RIGHT_HIGHER: 1,
    UNRANKED: {unranked: true},
};
