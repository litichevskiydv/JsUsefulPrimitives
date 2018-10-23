module.exports = class HashMap {
    constructor(equalityComparer) {
        this._equalityComparer = equalityComparer;
        this._data = new Map();
        this._size = 0;
    }

    get size() {
        return this._size;
    }

    get(key) {
        let bucket = this._data.get(this._equalityComparer.getHashCode(key));
        if (!bucket) return bucket;

        let pair = bucket.find(x => this._equalityComparer.equals(x[0], key));
        if (!pair) return pair;

        return pair[1];
    }

    set(key, value) {
        let hashCode = this._equalityComparer.getHashCode(key);
        let bucket = this._data.get(hashCode);
        if (!bucket) {
            bucket = [];
            this._data.set(hashCode, bucket);
        }

        let pair = bucket.find(x => this._equalityComparer.equals(x[0], key));
        if (!pair) {
            bucket.push([key, value]);
            this._size++;
        } else pair[1] = value;

        return this;
    }

    has(key) {
        return this.get(key) !== undefined;
    }

    delete(key) {
        let bucket = this._data.get(this._equalityComparer.getHashCode(key));
        if (!bucket) return false;

        for (var i = 0; i < bucket.length && this._equalityComparer.equals(bucket[i][0], key) === false; i++);
        if (i === bucket.length) return false;

        bucket.splice(i, 1);
        this._size--;
        return true;
    }

    clear() {
        this._data.clear();
        this._size = 0;
    }

    forEach(callbackfn) {
        this._data.forEach(bucket => bucket.forEach(value => callbackfn(value[1], value[0], this)));
    }

    *_iterateElements(selector) {
        for (let bucket of this._data.values()) {
            for (let pair of bucket) {
                yield selector(pair);
            }
        }
    }

    entries() {
        return this._iterateElements(pair => pair);
    }

    keys() {
        return this._iterateElements(pair => pair[0]);
    }

    values() {
        return this._iterateElements(pair => pair[1]);
    }

    [Symbol.iterator]() {
        return this.entries();
    }
};
