module.exports = class HashSet {
    constructor(equalityComparer) {
        this._equalityComparer = equalityComparer;
        this._data = new Map();
        this._size = 0;
    }

    get size() {
        return this._size;
    }

    add(value) {
        let hashCode = this._equalityComparer.getHashCode(value);
        let bucket = this._data.get(hashCode);
        if (!bucket) {
            bucket = [];
            this._data.set(hashCode, bucket);
        }

        if (bucket.some(x => this._equalityComparer.equals(x, value)) === false) {
            bucket.push(value);
            this._size++;
        }
        return this;
    }

    has(value) {
        let bucket = this._data.get(this._equalityComparer.getHashCode(value));
        if (!bucket) return false;

        return bucket.some(x => this._equalityComparer.equals(x, value));
    }

    delete(value) {
        let bucket = this._data.get(this._equalityComparer.getHashCode(value));
        if (!bucket) return false;

        for (var i = 0; i < bucket.length && this._equalityComparer.equals(bucket[i], value) === false; i++);
        if (i === bucket.length) return false;

        bucket.splice(i, 1);
        this._size--;
        return true;
    }

    clear() {
        this._data.clear();
        this._size = 0;
    }

    forEach(callback) {
        this._data.forEach(bucket => bucket.forEach(value => callback(value, value, this)));
    }

    *entries() {
        for (let bucket of this._data.values()) {
            for (let value of bucket) {
                yield value;
            }
        }
    }

    values() {
        return this.entries();
    }

    [Symbol.iterator]() {
        return this.entries();
    }
};
