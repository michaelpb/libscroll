'use strict';

const lodash = require('lodash');

class TreeNode {
    constructor(tag, parent, rank) {
        if (lodash.isString(tag)) {
            this.is_text = true;
            this.text = tag;
            this.tag = null;
            this.is_unranked = true;
        } else {
            this.is_text = false;
            this.tag  = tag;
            this.text = null;
            // if rank is not a number, we are "unranked"
            this.is_unranked = !lodash.isNumber(rank);
        }
        this.parent   = parent;
        this.children = [];
        this.head     = [];
        this.rank     = rank;
    }
}

module.exports = TreeNode;
