module.exports = class HashMap{
    constructor(equalityComparer){
        this._equalityComparer = equalityComparer;
        this._data = new Map();
    }

    get(key){
        let bucket = this._data.get(this._equalityComparer.getHashCode(key));
        if(bucket === undefined) return bucket;

        let pair = bucket.find(x => this._equalityComparer.equals(x[0], key));
        if(pair === undefined) return pair;

        return pair[1];
    }

    set(key, value){
        let hashCode = this._equalityComparer.getHashCode(key);
        let bucket = this._data.get(hashCode);
        if(bucket === undefined){
            bucket = [];
            this._data.set(hashCode, bucket);
        }

        let pair = bucket.find(x => this._equalityComparer.equals(x[0], key));
        if(pair === undefined) bucket.push([key, value]);
        else pair[1] = value;

        return this;
    }

    has(key){
        return this.get(key) !== undefined;
    }

    delete(key){
        let bucket = this._data.get(this._equalityComparer.getHashCode(key));
        if(bucket === undefined) return false;

        for(var i = 0; i < bucket.length && this._equalityComparer.equals(bucket[i][0], key) === false; i++);
        if(i === bucket.length) return false;

        bucket.splice(i, 1);
        return true;
    }

    clear(){
        this._data.clear();
    }

    forEach(callbackfn){
        this._data.forEach(bucket => bucket.forEach(value => callbackfn(value[1], value[0], this)));
    }

    *keys(){
        for(let bucket of this._data.values())
        {
            for(let pair of bucket){
                yield pair[0];                
            }
        }
    }

    *values(){
        for(let bucket of this._data.values())
        {
            for(let pair of bucket){
                yield pair[1];                
            }
        }
    }

    *entries(){
        for(let bucket of this._data.values())
        {
            for(let pair of bucket){
                yield pair;                
            }
        }
    }
}