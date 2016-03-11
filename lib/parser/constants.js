module.exports = {
    // Flat:
    TEXT: 1,
    TAG: 2,
    OPEN_TAG: 3,
    CLOSE_TAG: 4,

    REVERSED: Object.freeze({
        1: "TEXT",
        2: "TAG",
        3: "OPEN_TAG",
        4: "CLOSE_TAG",
        5: "NODE_ENTER",
        6: "NODE_EXIT",
        7: "NODE",
    }),

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
