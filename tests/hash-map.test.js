const HashMap = require("./../src/hash-map.js");

class Key{
    constructor(hi, lo){
        this.hi = hi;
        this.lo = lo;
    }
}

class KeysComparer{
    getHashCode(obj){
        let hash = 17;
        hash = (hash * 31) + obj.hi;
        hash = (hash * 31) + obj.lo;
        return hash;
    }

    equals(a, b){
        return a.hi === b.hi && a.lo === b.lo;
    }
}

test("Should set and get value",
() => {
    // Given
    let map = new HashMap(new KeysComparer());

    let firstKey = new Key(1, 1);
    let firstKeyValue = 1;

    // When
    map.set(firstKey, firstKeyValue);

    // Then
    let secondKey = new Key(firstKey.hi, firstKey.lo); 
    expect(map.get(secondKey)).toBe(firstKeyValue);
});

test("Should confirm key existence",
() => {
    // Given
    let map = new HashMap(new KeysComparer());

    let firstKey = new Key(1, 1);
    let firstKeyValue = 1;

    // When
    map.set(firstKey, firstKeyValue);
 
    // Then
    expect(map.has(firstKey)).toBeTruthy();
});

test("Should delete existed key",
() => {
    // Given
    let map = new HashMap(new KeysComparer());

    let firstKey = new Key(1, 1);
    let firstKeyValue = 1;

    let secondKey = new Key(2, 2);
    let secondKeyValue = 2;

    // When
    map.set(firstKey, firstKeyValue);
    map.set(secondKey, secondKeyValue);
    
    // Then
    expect(map.delete(firstKey)).toBeTruthy();
    expect(map.get(secondKey)).toBe(secondKeyValue);
});

test("Should delete not existed key",
() => {
    // Given
    let map = new HashMap(new KeysComparer());

    let key = new Key(1, 1);
    
    // When, Then
    expect(map.delete(key)).toBeFalsy();
});

test("Should clear collection",
() => {
    // Given
    let map = new HashMap(new KeysComparer());

    let firstKey = new Key(1, 1);
    let firstKeyValue = 1;

    let secondKey = new Key(2, 2);
    let secondKeyValue = 2;

    // When
    map.set(firstKey, firstKeyValue);
    map.set(secondKey, secondKeyValue);
    map.clear();
    
    // Then
    expect(map.has(firstKey)).toBeFalsy();
    expect(map.has(secondKey)).toBeFalsy();
});

test("Should collect values",
() => {
    // Given
    let map = new HashMap(new KeysComparer());

    let firstKey = new Key(1, 1);
    let firstKeyValue = 1;

    let secondKey = new Key(2, 2);
    let secondKeyValue = 2;

    // When
    map.set(firstKey, firstKeyValue);
    map.set(secondKey, secondKeyValue);
    let values = [];
    map.forEach(x  =>values.push(x));
    
    // Then
    expect(values).toContain(firstKeyValue);
    expect(values).toContain(secondKeyValue);
});

test("Should get keys",
() => {
    // Given
    let map = new HashMap(new KeysComparer());

    let firstKey = new Key(1, 1);
    let firstKeyValue = 1;

    let secondKey = new Key(2, 2);
    let secondKeyValue = 2;

    // When
    map.set(firstKey, firstKeyValue);
    map.set(secondKey, secondKeyValue);
    let keys = Array.from(map.keys());
    
    // Then
    expect(keys).toContain(firstKey);
    expect(keys).toContain(secondKey);
});

test("Should get values",
() => {
    // Given
    let map = new HashMap(new KeysComparer());

    let firstKey = new Key(1, 1);
    let firstKeyValue = 1;

    let secondKey = new Key(2, 2);
    let secondKeyValue = 2;

    // When
    map.set(firstKey, firstKeyValue);
    map.set(secondKey, secondKeyValue);
    let values = Array.from(map.values());
    
    // Then
    expect(values).toContain(firstKeyValue);
    expect(values).toContain(secondKeyValue);
});

test("Should get entries",
() => {
    // Given
    let map = new HashMap(new KeysComparer());

    let firstKey = new Key(1, 1);
    let firstKeyValue = 1;

    let secondKey = new Key(2, 2);
    let secondKeyValue = 2;

    // When
    map.set(firstKey, firstKeyValue);
    map.set(secondKey, secondKeyValue);
    let entries = Array.from(map.entries());
    
    // Then
    expect(entries.map(x => x[0])).toContain(firstKey);
    expect(entries.map(x => x[0])).toContain(secondKey);

    expect(entries.map(x => x[1])).toContain(firstKeyValue);
    expect(entries.map(x => x[1])).toContain(secondKeyValue);
});

test("Should iterate collection",
() => {
    // Given
    let map = new HashMap(new KeysComparer());

    let firstKey = new Key(1, 1);
    let firstKeyValue = 1;

    let secondKey = new Key(2, 2);
    let secondKeyValue = 2;

    // When
    map.set(firstKey, firstKeyValue);
    map.set(secondKey, secondKeyValue);

    let entries = Array.from(map);
    
    // Then
    expect(entries.map(x => x[0])).toContain(firstKey);
    expect(entries.map(x => x[0])).toContain(secondKey);

    expect(entries.map(x => x[1])).toContain(firstKeyValue);
    expect(entries.map(x => x[1])).toContain(secondKeyValue);
});