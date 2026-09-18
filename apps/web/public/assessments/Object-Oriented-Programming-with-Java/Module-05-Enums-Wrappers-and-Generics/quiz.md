# Quiz — Object Oriented Programming with Java — Module 5: Enums, Wrappers and Generics

**Subject:** Object Oriented Programming with Java  
**Module:** Module 5 — Enums, Wrappers and Generics  
**Questions:** 71  
**Mix:** 11 Easy · 34 Intermediate · 26 Difficult  
**Type:** Multiple choice (single correct option)  
**Instructions:** Choose the best option. Answers and short explanations follow each question.

---

### Q01  ·  Easy
**Question:** Autoboxing converts:

- **A.** Integer to String
- **B.** int to Integer
- **C.** String to StringBuilder
- **D.** enum to int always

**Answer:** B
**Explanation:** Primitive to wrapper.

### Q02  ·  Easy
**Question:** The wrapper for char is:

- **A.** Chr
- **B.** Char
- **C.** Character
- **D.** String

**Answer:** C
**Explanation:** Character boxes char.

### Q03  ·  Easy
**Question:** Which method returns all constants of enum Colour?

- **A.** Colour.values()
- **B.** new Colour[]{}
- **C.** Colour.get()
- **D.** Colour.list()

**Answer:** A
**Explanation:** The compiler adds values().

### Q04  ·  Easy
**Question:** Which option best describes **Generic method**?

- **A.** A raw Object method.
- **B.** An enum constructor only.
- **C.** A method that cannot be static.
- **D.** A method with its own type parameters, inferred from arguments or given explicitly.

**Answer:** D
**Explanation:** Generic method: A method with its own type parameters, inferred from arguments or given explicitly.

### Q05  ·  Easy
**Question:** Which option best describes **PECS**?

- **A.** Always use raw types.
- **B.** Always use <? extends T> for add.
- **C.** Producer-extends, consumer-super: use <? extends T> to read, <? super T> to write.
- **D.** A thread policy.

**Answer:** C
**Explanation:** PECS: Producer-extends, consumer-super: use <? extends T> to read, <? super T> to write.

### Q06  ·  Easy
**Question:** Which option best describes **Raw type**?

- **A.** Using a generic type without arguments, e.g. List, for migration; unsafe.
- **B.** An enum.
- **C.** A primitive.
- **D.** List<Object> which is fully safe and identical to List<String>.

**Answer:** A
**Explanation:** Raw type: Using a generic type without arguments, e.g. List, for migration; unsafe.

### Q07  ·  Easy
**Question:** Which option best describes **Unboxing**?

- **A.** Casting Object to List.
- **B.** The compiler inserting a conversion from wrapper to primitive (e.g. int n = x;).
- **C.** Enum ordinal conversion only.
- **D.** Parsing a String.

**Answer:** B
**Explanation:** Unboxing: The compiler inserting a conversion from wrapper to primitive (e.g. int n = x;).

### Q08  ·  Easy
**Question:** Which option best describes **enum**?

- **A.** A primitive integer with names only in the preprocessor.
- **B.** A special class with a fixed set of named instances (constants), optionally with fields and methods.
- **C.** A List of String.
- **D.** A package.

**Answer:** B
**Explanation:** enum: A special class with a fixed set of named instances (constants), optionally with fields and methods.

### Q09  ·  Easy
**Question:** Which option best describes **ordinal()**?

- **A.** The hashCode of the name.
- **B.** A random id.
- **C.** A stable database primary key you should persist.
- **D.** The zero-based position of an enum constant in the declaration list.

**Answer:** D
**Explanation:** ordinal(): The zero-based position of an enum constant in the declaration list.

### Q10  ·  Easy
**Question:** Which sequence correctly describes **enum valueOf**?

- **A.** match the exact constant name → return that instance, else IllegalArgumentException
- **B.** construct new Enum() on miss
- **C.** ignore case by default
- **D.** parse ordinal integers first

**Answer:** A
**Explanation:** Correct sequence for enum valueOf: match the exact constant name → return that instance, else IllegalArgumentException

### Q11  ·  Easy
**Question:** Which sequence correctly describes **generic compile**?

- **A.** delete all casts
- **B.** emit a new class per T like C++ templates
- **C.** type-check uses of T → erase T to bound or Object → insert casts/bridges in bytecode
- **D.** reify T in the class file as a runtime field always

**Answer:** C
**Explanation:** Correct sequence for generic compile: type-check uses of T → erase T to bound or Object → insert casts/bridges in bytecode

### Q12  ·  Intermediate
**Question:** A bounded parameter <T extends Comparable<T>> means:

- **A.** T is a type that can be compared to itself
- **B.** T is erased to Comparable and you may new T()
- **C.** T extends String only
- **D.** T must be a primitive int

**Answer:** A
**Explanation:** Upper bound Comparable<T>.

### Q13  ·  Intermediate
**Question:** Integer x = null; int y = x; Result:

- **A.** NullPointerException on unboxing
- **B.** y becomes 0
- **C.** compile error always
- **D.** y becomes -1

**Answer:** A
**Explanation:** Unboxing calls intValue() on null.

### Q14  ·  Intermediate
**Question:** Integer.valueOf(100) == Integer.valueOf(100) is:

- **A.** Guaranteed false
- **B.** Typically true due to the Integer cache
- **C.** A compile error
- **D.** Always throws

**Answer:** B
**Explanation:** 100 is in -128..127.

### Q15  ·  Intermediate
**Question:** List<? extends Number> list given as a parameter. list.add(3) :

- **A.** Adds a Number
- **B.** Adds an Integer
- **C.** Compile error (except add(null))
- **D.** Erases and succeeds

**Answer:** C
**Explanation:** Producer-extends is not a consumer; the actual T might be Double.

### Q16  ·  Intermediate
**Question:** What is the most important distinction between **Integer** and **int**?

- **A.** Integer can be null and is a reference; int is a 32-bit primitive never null.
- **B.** int can be used as a type argument: List<int>.
- **C.** Integer is 64 bits.
- **D.** They are the same in generic type arguments.

**Answer:** A
**Explanation:** Integer can be null and is a reference; int is a 32-bit primitive never null.

### Q17  ·  Intermediate
**Question:** What is the most important distinction between **List<? extends Number>** and **List<Number>**?

- **A.** List<Number> forbids get.
- **B.** They are the same type.
- **C.** You can add Integer to List<? extends Number>.
- **D.** You can get Number from both, but cannot add except null to the wildcard producer.

**Answer:** D
**Explanation:** You can get Number from both, but cannot add except null to the wildcard producer.

### Q18  ·  Intermediate
**Question:** What is the most important distinction between **enum** and **public static final int constants**?

- **A.** They are identical at runtime.
- **B.** Ints can implement interfaces with methods.
- **C.** Enums are primitives.
- **D.** Enums are typed, have methods/values()/switch support; ints are untyped and not namespaced.

**Answer:** D
**Explanation:** Enums are typed, have methods/values()/switch support; ints are untyped and not namespaced.

### Q19  ·  Intermediate
**Question:** What is the most important distinction between **values()** and **valueOf(String)**?

- **A.** values() parses user text.
- **B.** values() lists all constants; valueOf maps a name to one constant.
- **C.** They are instance methods on each constant.
- **D.** valueOf returns an array.

**Answer:** B
**Explanation:** values() lists all constants; valueOf maps a name to one constant.

### Q20  ·  Intermediate
**Question:** Which option best describes **Autoboxing**?

- **A.** Erasing a type parameter.
- **B.** The compiler inserting a conversion from primitive to wrapper (e.g. Integer x = 5;).
- **C.** Calling values() on an enum.
- **D.** Casting a String to int.

**Answer:** B
**Explanation:** Autoboxing: The compiler inserting a conversion from primitive to wrapper (e.g. Integer x = 5;).

### Q21  ·  Intermediate
**Question:** Which option best describes **Bounded type**?

- **A.** A lower bound on a class type parameter using super in the class header (Box<T super Number> is legal).
- **B.** A parameter that must be a primitive.
- **C.** A type parameter restricted with extends Type (upper bound), optionally with additional interfaces.
- **D.** An enum bound only.

**Answer:** C
**Explanation:** Bounded type: A type parameter restricted with extends Type (upper bound), optionally with additional interfaces.

### Q22  ·  Intermediate
**Question:** Which option best describes **Diamond operator**?

- **A.** A bitwise XOR.
- **B.** A bound wildcard.
- **C.** <> on the right-hand side letting the compiler infer constructor type arguments (Java 7+).
- **D.** An enum method.

**Answer:** C
**Explanation:** Diamond operator: <> on the right-hand side letting the compiler infer constructor type arguments (Java 7+).

### Q23  ·  Intermediate
**Question:** Which option best describes **Generic class**?

- **A.** An enum with a type parameter on each constant (as a required feature).
- **B.** A class parameterised by a type variable, e.g. Box<T>, checked at compile time.
- **C.** A class that only stores Object with no compiler checks.
- **D.** A primitive array.

**Answer:** B
**Explanation:** Generic class: A class parameterised by a type variable, e.g. Box<T>, checked at compile time.

### Q24  ·  Intermediate
**Question:** Which option best describes **Integer cache**?

- **A.** valueOf/autoboxing reuses Integer objects for a small range, at least -128..127.
- **B.** A cache of all int values.
- **C.** A Thread-local of enums.
- **D.** A JVM flag that caches Strings only.

**Answer:** A
**Explanation:** Integer cache: valueOf/autoboxing reuses Integer objects for a small range, at least -128..127.

### Q25  ·  Intermediate
**Question:** Which option best describes **Number wrappers**?

- **A.** Byte, Short, Integer, Long, Float, Double extending Number.
- **B.** Only Integer.
- **C.** Character and Boolean extending Number.
- **D.** enum constants.

**Answer:** A
**Explanation:** Number wrappers: Byte, Short, Integer, Long, Float, Double extending Number.

### Q26  ·  Intermediate
**Question:** Which option best describes **Type erasure**?

- **A.** Reifying T so it is available as T.class at runtime.
- **B.** The compiler removing generic type arguments for the JVM, inserting casts and bridge methods.
- **C.** A JIT optimisation only.
- **D.** Storing T in every instance header.

**Answer:** B
**Explanation:** Type erasure: The compiler removing generic type arguments for the JVM, inserting casts and bridge methods.

### Q27  ·  Intermediate
**Question:** Which option best describes **Wildcard ?**?

- **A.** An enum name.
- **B.** An unknown type in a use-site, e.g. List<?> or List<? extends Number>.
- **C.** A primitive.
- **D.** A type parameter declaration on a class (class Box<?> is the usual class header).

**Answer:** B
**Explanation:** Wildcard ?: An unknown type in a use-site, e.g. List<?> or List<? extends Number>.

### Q28  ·  Intermediate
**Question:** Which option best describes **Wrapper class**?

- **A.** An immutable object type that boxes a primitive, e.g. Integer for int.
- **B.** A primitive typedef.
- **C.** A Thread subclass.
- **D.** An enum.

**Answer:** A
**Explanation:** Wrapper class: An immutable object type that boxes a primitive, e.g. Integer for int.

### Q29  ·  Intermediate
**Question:** Which option best describes **parseInt**?

- **A.** An enum parser.
- **B.** A silent return of 0 on error.
- **C.** A method that returns Integer only.
- **D.** Integer.parseInt(String) returns a primitive int, throwing NumberFormatException on junk.

**Answer:** D
**Explanation:** parseInt: Integer.parseInt(String) returns a primitive int, throwing NumberFormatException on junk.

### Q30  ·  Intermediate
**Question:** Which option best describes **valueOf(String)**?

- **A.** A static method that returns the enum constant whose name equals the string (or throws).
- **B.** An instance method on the constant.
- **C.** A wrapper parse method.
- **D.** A method that returns the ordinal as String.

**Answer:** A
**Explanation:** valueOf(String): A static method that returns the enum constant whose name equals the string (or throws).

### Q31  ·  Intermediate
**Question:** Which option best describes **values()**?

- **A.** A method that parses int.
- **B.** A generic method.
- **C.** An instance method on Object.
- **D.** A compiler-added static method returning all enum constants in declaration order.

**Answer:** D
**Explanation:** values(): A compiler-added static method returning all enum constants in declaration order.

### Q32  ·  Intermediate
**Question:** Which sequence correctly describes **autoboxing assignment**?

- **A.** bit-cast the primitive to a reference without an object
- **B.** always new Wrapper() with no cache
- **C.** primitive expression → compiler emits valueOf (or equivalent) → wrapper reference stored
- **D.** store the primitive in a List<int>

**Answer:** C
**Explanation:** Correct sequence for autoboxing assignment: primitive expression → compiler emits valueOf (or equivalent) → wrapper reference stored

### Q33  ·  Intermediate
**Question:** Which sequence correctly describes **unboxing in arithmetic**?

- **A.** throw if the wrapper is non-null
- **B.** operate on Integer objects with operator+ without unbox
- **C.** wrapper → primitiveValue() → operate as primitive → maybe box the result
- **D.** use ordinal()

**Answer:** C
**Explanation:** Correct sequence for unboxing in arithmetic: wrapper → primitiveValue() → operate as primitive → maybe box the result

### Q34  ·  Intermediate
**Question:** Which statement about **Bounded type** is FALSE?

- **A.** A useful way to remember Bounded type is that it is not the same as “A parameter that must be a primitive”.
- **B.** class Box<T extends Number> allows Box<String>.
- **C.** Bounded type is correctly understood as: a type parameter restricted with extends Type (upper bound), optionally with additional interfaces.
- **D.** In this module, Bounded type is a core idea students must distinguish from nearby terms.

**Answer:** B
**Explanation:** The false claim is: class Box<T extends Number> allows Box<String>.. Bounded type actually means: A type parameter restricted with extends Type (upper bound), optionally with additional interfaces.

### Q35  ·  Intermediate
**Question:** Which statement about **Generic class** is FALSE?

- **A.** A useful way to remember Generic class is that it is not the same as “A class that only stores Object with no compiler checks”.
- **B.** Generic class is correctly understood as: a class parameterised by a type variable, e.g. Box<T>, checked at compile time.
- **C.** In this module, Generic class is a core idea students must distinguish from nearby terms.
- **D.** At runtime a Box<String> has a different class from Box<Integer> (reified T).

**Answer:** D
**Explanation:** The false claim is: At runtime a Box<String> has a different class from Box<Integer> (reified T).. Generic class actually means: A class parameterised by a type variable, e.g. Box<T>, checked at compile time.

### Q36  ·  Intermediate
**Question:** Which statement about **Number wrappers** is FALSE?

- **A.** In this module, Number wrappers is a core idea students must distinguish from nearby terms.
- **B.** Boolean extends Number so you can call doubleValue() on it.
- **C.** A useful way to remember Number wrappers is that it is not the same as “Only Integer”.
- **D.** Number wrappers is correctly understood as: byte, Short, Integer, Long, Float, Double extending Number.

**Answer:** B
**Explanation:** The false claim is: Boolean extends Number so you can call doubleValue() on it.. Number wrappers actually means: Byte, Short, Integer, Long, Float, Double extending Number.

### Q37  ·  Intermediate
**Question:** Which statement about **Raw type** is FALSE?

- **A.** Raw types give the same compile-time checks as List<String>.
- **B.** A useful way to remember Raw type is that it is not the same as “List<Object> which is fully safe and identical to List<String>”.
- **C.** Raw type is correctly understood as: using a generic type without arguments, e.g. List, for migration; unsafe.
- **D.** In this module, Raw type is a core idea students must distinguish from nearby terms.

**Answer:** A
**Explanation:** The false claim is: Raw types give the same compile-time checks as List<String>.. Raw type actually means: Using a generic type without arguments, e.g. List, for migration; unsafe.

### Q38  ·  Intermediate
**Question:** Which statement about **Unboxing** is FALSE?

- **A.** Unboxing null throws ClassCastException, not NullPointerException.
- **B.** Unboxing is correctly understood as: the compiler inserting a conversion from wrapper to primitive (e.g. int n = x;).
- **C.** In this module, Unboxing is a core idea students must distinguish from nearby terms.
- **D.** A useful way to remember Unboxing is that it is not the same as “Parsing a String”.

**Answer:** A
**Explanation:** The false claim is: Unboxing null throws ClassCastException, not NullPointerException.. Unboxing actually means: The compiler inserting a conversion from wrapper to primitive (e.g. int n = x;).

### Q39  ·  Intermediate
**Question:** Which statement about **Wildcard ?** is FALSE?

- **A.** List<?> is exactly List<Object> and you may add any object to it.
- **B.** Wildcard ? is correctly understood as: an unknown type in a use-site, e.g. List<?> or List<? extends Number>.
- **C.** A useful way to remember Wildcard ? is that it is not the same as “A type parameter declaration on a class (class Box<?> is the usual class header)”.
- **D.** In this module, Wildcard ? is a core idea students must distinguish from nearby terms.

**Answer:** A
**Explanation:** The false claim is: List<?> is exactly List<Object> and you may add any object to it.. Wildcard ? actually means: An unknown type in a use-site, e.g. List<?> or List<? extends Number>.

### Q40  ·  Intermediate
**Question:** Which statement about **Wrapper class** is FALSE?

- **A.** Wrapper class is correctly understood as: an immutable object type that boxes a primitive, e.g. Integer for int.
- **B.** Integer is a mutable holder; you can do i.value = 3.
- **C.** In this module, Wrapper class is a core idea students must distinguish from nearby terms.
- **D.** A useful way to remember Wrapper class is that it is not the same as “A Thread subclass”.

**Answer:** B
**Explanation:** The false claim is: Integer is a mutable holder; you can do i.value = 3.. Wrapper class actually means: An immutable object type that boxes a primitive, e.g. Integer for int.

### Q41  ·  Intermediate
**Question:** Which statement about **enum** is FALSE?

- **A.** enum is correctly understood as: a special class with a fixed set of named instances (constants), optionally with fields and methods.
- **B.** A useful way to remember enum is that it is not the same as “A primitive integer with names only in the preprocessor”.
- **C.** You can instantiate an enum with new Day() outside the enum body.
- **D.** In this module, enum is a core idea students must distinguish from nearby terms.

**Answer:** C
**Explanation:** The false claim is: You can instantiate an enum with new Day() outside the enum body.. enum actually means: A special class with a fixed set of named instances (constants), optionally with fields and methods.

### Q42  ·  Intermediate
**Question:** Which statement about **valueOf(String)** is FALSE?

- **A.** valueOf(String) is correctly understood as: a static method that returns the enum constant whose name equals the string (or throws).
- **B.** In this module, valueOf(String) is a core idea students must distinguish from nearby terms.
- **C.** valueOf ignores case and never throws.
- **D.** A useful way to remember valueOf(String) is that it is not the same as “A method that returns the ordinal as String”.

**Answer:** C
**Explanation:** The false claim is: valueOf ignores case and never throws.. valueOf(String) actually means: A static method that returns the enum constant whose name equals the string (or throws).

### Q43  ·  Intermediate
**Question:** You need a fixed set of traffic-light states with a next() method. Prefer:

- **A.** An enum with methods
- **B.** A boolean
- **C.** A Stringly-typed API
- **D.** public static final int RED=0 etc.

**Answer:** A
**Explanation:** Enums nest behaviour with a closed set of instances.

### Q44  ·  Intermediate
**Question:** class Box<T extends Number> { } new Box<String>() :

- **A.** Allowed by PECS
- **B.** Runs and erases
- **C.** Compile error: String is not a Number
- **D.** Allowed as raw type only in that syntax

**Answer:** C
**Explanation:** Upper bound Number rejects String.

### Q45  ·  Intermediate
**Question:** valueOf("FRIDAY") on enum Day that has no FRIDAY:

- **A.** creates a new constant
- **B.** throws IllegalArgumentException
- **C.** returns ordinal 0
- **D.** returns null

**Answer:** B
**Explanation:** Unknown name is an IAE.

### Q46  ·  Difficult
**Question:** Bridge methods exist after erasure so that:

- **A.** A subclass override with a tighter return/erased signature still implements the parent’s erased method
- **B.** T is reified
- **C.** int can be a type argument
- **D.** enums can extend classes

**Answer:** A
**Explanation:** Bridges forward to the actual override after erasure.

### Q47  ·  Difficult
**Question:** Day.TUE.ordinal() if MON is first?

- **A.** 3
- **B.** 1
- **C.** 0
- **D.** 2

**Answer:** B
**Explanation:** Zero-based: MON=0, TUE=1.

### Q48  ·  Difficult
**Question:** How many bytes does a Java double occupy?

- **A.** 1
- **B.** 8
- **C.** 4
- **D.** 2

**Answer:** B
**Explanation:** double is 64 bits = 8 bytes.

### Q49  ·  Difficult
**Question:** Integer a = 127; Integer b = 127; (a == b) is typically:

- **A.** false
- **B.** throws
- **C.** true
- **D.** compile error

**Answer:** C
**Explanation:** valueOf caches at least -128..127 so the references may be identical.

### Q50  ·  Difficult
**Question:** Integer a = 128; Integer b = 128; (a == b) is typically:

- **A.** throws
- **B.** false
- **C.** true
- **D.** compile error

**Answer:** B
**Explanation:** 128 is outside the mandatory cache; two valueOf/autobox allocations are distinct objects. == is identity.

### Q51  ·  Difficult
**Question:** List raw = new ArrayList(); after adding "x", (String) raw.get(0) at runtime: erasure means get returns:

- **A.** String without a cast needed in bytecode
- **B.** Integer
- **C.** void
- **D.** Object, and a checkcast to String is inserted

**Answer:** D
**Explanation:** Erasure makes List get() return Object; javac inserts a cast at the use site.

### Q52  ·  Difficult
**Question:** Map<String, Integer> ages = new HashMap<>(); ages.put("A", 18); This compiles because of:

- **A.** enum values
- **B.** Erasure of String
- **C.** Autoboxing 18 to Integer
- **D.** int type arguments

**Answer:** C
**Explanation:** put expects Integer; 18 is boxed.

### Q53  ·  Difficult
**Question:** What is the most important distinction between **Box<T>** and **Box<Object>**?

- **A.** Box<String> is a subtype of Box<Object>.
- **B.** They are always interchangeable.
- **C.** Box<T> preserves a specific T; Box<Object> can hold any reference but loses T at the API.
- **D.** Generics are covariant like arrays.

**Answer:** C
**Explanation:** Box<T> preserves a specific T; Box<Object> can hold any reference but loses T at the API.

### Q54  ·  Difficult
**Question:** What is the most important distinction between **autoboxing** and **explicit Integer.valueOf**?

- **A.** They produce different primitive types.
- **B.** Autoboxing always calls new Integer.
- **C.** Autoboxing is compiler sugar that typically calls valueOf; you can still call valueOf yourself.
- **D.** valueOf never caches.

**Answer:** C
**Explanation:** Autoboxing is compiler sugar that typically calls valueOf; you can still call valueOf yourself.

### Q55  ·  Difficult
**Question:** What is the most important distinction between **parseInt** and **valueOf(String) for Integer**?

- **A.** valueOf(String) returns int.
- **B.** Both return int.
- **C.** Both never throw.
- **D.** parseInt returns int; Integer.valueOf(String) returns Integer (possibly cached).

**Answer:** D
**Explanation:** parseInt returns int; Integer.valueOf(String) returns Integer (possibly cached).

### Q56  ·  Difficult
**Question:** What is the most important distinction between **type erasure** and **reified generics (as in some other languages)**?

- **A.** new T() works because T is reified.
- **B.** Java stores T in every object header as a Class.
- **C.** Erasure means generics have no compile-time checks.
- **D.** Java erases T so one class Box exists at runtime; reified systems keep T.

**Answer:** D
**Explanation:** Java erases T so one class Box exists at runtime; reified systems keep T.

### Q57  ·  Difficult
**Question:** Which statement about **Autoboxing** is FALSE?

- **A.** Autoboxing is a runtime JVM instruction distinct from invokevirtual that never allocates.
- **B.** Autoboxing is correctly understood as: the compiler inserting a conversion from primitive to wrapper (e.g. Integer x = 5;).
- **C.** A useful way to remember Autoboxing is that it is not the same as “Casting a String to int”.
- **D.** In this module, Autoboxing is a core idea students must distinguish from nearby terms.

**Answer:** A
**Explanation:** The false claim is: Autoboxing is a runtime JVM instruction distinct from invokevirtual that never allocates.. Autoboxing actually means: The compiler inserting a conversion from primitive to wrapper (e.g. Integer x = 5;).

### Q58  ·  Difficult
**Question:** Which statement about **Diamond operator** is FALSE?

- **A.** new ArrayList<>() is illegal; you must repeat ArrayList<String> on the right.
- **B.** A useful way to remember Diamond operator is that it is not the same as “A bitwise XOR”.
- **C.** In this module, Diamond operator is a core idea students must distinguish from nearby terms.
- **D.** Diamond operator is correctly understood as: <> on the right-hand side letting the compiler infer constructor type arguments (Java 7+).

**Answer:** A
**Explanation:** The false claim is: new ArrayList<>() is illegal; you must repeat ArrayList<String> on the right.. Diamond operator actually means: <> on the right-hand side letting the compiler infer constructor type arguments (Java 7+).

### Q59  ·  Difficult
**Question:** Which statement about **Generic method** is FALSE?

- **A.** A useful way to remember Generic method is that it is not the same as “A method that cannot be static”.
- **B.** In this module, Generic method is a core idea students must distinguish from nearby terms.
- **C.** Generic methods are illegal on non-generic classes.
- **D.** Generic method is correctly understood as: a method with its own type parameters, inferred from arguments or given explicitly.

**Answer:** C
**Explanation:** The false claim is: Generic methods are illegal on non-generic classes.. Generic method actually means: A method with its own type parameters, inferred from arguments or given explicitly.

### Q60  ·  Difficult
**Question:** Which statement about **Integer cache** is FALSE?

- **A.** new Integer(5) == Integer.valueOf(5) is guaranteed true.
- **B.** In this module, Integer cache is a core idea students must distinguish from nearby terms.
- **C.** A useful way to remember Integer cache is that it is not the same as “A cache of all int values”.
- **D.** Integer cache is correctly understood as: valueOf/autoboxing reuses Integer objects for a small range, at least -128..127.

**Answer:** A
**Explanation:** The false claim is: new Integer(5) == Integer.valueOf(5) is guaranteed true.. Integer cache actually means: valueOf/autoboxing reuses Integer objects for a small range, at least -128..127.

### Q61  ·  Difficult
**Question:** Which statement about **PECS** is FALSE?

- **A.** You can add String to a List<? extends Object> safely in general.
- **B.** PECS is correctly understood as: producer-extends, consumer-super: use <? extends T> to read, <? super T> to write.
- **C.** In this module, PECS is a core idea students must distinguish from nearby terms.
- **D.** A useful way to remember PECS is that it is not the same as “Always use <? extends T> for add”.

**Answer:** A
**Explanation:** The false claim is: You can add String to a List<? extends Object> safely in general.. PECS actually means: Producer-extends, consumer-super: use <? extends T> to read, <? super T> to write.

### Q62  ·  Difficult
**Question:** Which statement about **Type erasure** is FALSE?

- **A.** In this module, Type erasure is a core idea students must distinguish from nearby terms.
- **B.** You can write new T() and T.class inside a generic class without a Class<T> token because T is reified.
- **C.** Type erasure is correctly understood as: the compiler removing generic type arguments for the JVM, inserting casts and bridge methods.
- **D.** A useful way to remember Type erasure is that it is not the same as “Reifying T so it is available as T.class at runtime”.

**Answer:** B
**Explanation:** The false claim is: You can write new T() and T.class inside a generic class without a Class<T> token because T is reified.. Type erasure actually means: The compiler removing generic type arguments for the JVM, inserting casts and bridge methods.

### Q63  ·  Difficult
**Question:** Which statement about **ordinal()** is FALSE?

- **A.** ordinal() is the recommended value to store in databases because it never changes when you insert a new constant in the middle.
- **B.** A useful way to remember ordinal() is that it is not the same as “A stable database primary key you should persist”.
- **C.** ordinal() is correctly understood as: the zero-based position of an enum constant in the declaration list.
- **D.** In this module, ordinal() is a core idea students must distinguish from nearby terms.

**Answer:** A
**Explanation:** The false claim is: ordinal() is the recommended value to store in databases because it never changes when you insert a new constant in the middle.. ordinal() actually means: The zero-based position of an enum constant in the declaration list.

### Q64  ·  Difficult
**Question:** Which statement about **parseInt** is FALSE?

- **A.** In this module, parseInt is a core idea students must distinguish from nearby terms.
- **B.** A useful way to remember parseInt is that it is not the same as “A method that returns Integer only”.
- **C.** parseInt("12.0") succeeds and returns 12.
- **D.** parseInt is correctly understood as: integer.parseInt(String) returns a primitive int, throwing NumberFormatException on junk.

**Answer:** C
**Explanation:** The false claim is: parseInt("12.0") succeeds and returns 12.. parseInt actually means: Integer.parseInt(String) returns a primitive int, throwing NumberFormatException on junk.

### Q65  ·  Difficult
**Question:** Which statement about **values()** is FALSE?

- **A.** In this module, values() is a core idea students must distinguish from nearby terms.
- **B.** values() is correctly understood as: a compiler-added static method returning all enum constants in declaration order.
- **C.** values() is inherited from Object and can be overridden in every enum.
- **D.** A useful way to remember values() is that it is not the same as “An instance method on Object”.

**Answer:** C
**Explanation:** The false claim is: values() is inherited from Object and can be overridden in every enum.. values() actually means: A compiler-added static method returning all enum constants in declaration order.

### Q66  ·  Difficult
**Question:** Why can’t a generic method do new T() easily?

- **A.** The JVM forbids new
- **B.** Enums cannot be generic
- **C.** Erasure: T is not a runtime class to instantiate
- **D.** T is always primitive

**Answer:** C
**Explanation:** Need a factory or Class<T> token.

### Q67  ·  Difficult
**Question:** Why is List<String> not a subtype of List<Object>?

- **A.** Arrays are invariant too so lists match arrays
- **B.** String is not an Object
- **C.** Generics are invariant: adding an Object to a List<String> would break type safety
- **D.** Because of erasure they are the same so subtyping is allowed

**Answer:** C
**Explanation:** Invariance plus heap pollution if it were covariant.

### Q68  ·  Difficult
**Question:** You compare two Integer objects with == after computing 1000+1 twice via autoboxing. Risk:

- **A.** Compiler rejects ==
- **B.** == is specified true for all integers
- **C.** They unbox and then == is illegal
- **D.** == may be false because they are distinct objects; use equals

**Answer:** D
**Explanation:** Cache is only guaranteed for a small range; use equals for value.

### Q69  ·  Difficult
**Question:** enum Day { MON, TUE, WED } How many values does Day.values().length yield?

- **A.** 1
- **B.** 2
- **C.** 0
- **D.** 3

**Answer:** D
**Explanation:** Three constants in declaration order.

### Q70  ·  Difficult
**Question:** int n = Integer.parseInt("104"); n is:

- **A.** 104 as int
- **B.** throws
- **C.** 104 as Integer object
- **D.** 4

**Answer:** A
**Explanation:** parseInt returns the primitive int 104.

### Q71  ·  Difficult
**Question:** switch (day) with day an enum. case labels must be:

- **A.** Unqualified constant names like MONDAY
- **B.** Integers matching ordinals only
- **C.** Strings of ordinals
- **D.** Day.MONDAY in older javac only as the required form inside the switch

**Answer:** A
**Explanation:** Enum switch cases use the constant’s simple name.

---

## Quick answer key

Q01–B | Q02–C | Q03–A | Q04–D | Q05–C | Q06–A | Q07–B | Q08–B | Q09–D | Q10–A | Q11–C | Q12–A | Q13–A | Q14–B | Q15–C | Q16–A | Q17–D | Q18–D | Q19–B | Q20–B | Q21–C | Q22–C | Q23–B | Q24–A | Q25–A | Q26–B | Q27–B | Q28–A | Q29–D | Q30–A | Q31–D | Q32–C | Q33–C | Q34–B | Q35–D | Q36–B | Q37–A | Q38–A | Q39–A | Q40–B | Q41–C | Q42–C | Q43–A | Q44–C | Q45–B | Q46–A | Q47–B | Q48–B | Q49–C | Q50–B | Q51–D | Q52–C | Q53–C | Q54–C | Q55–D | Q56–D | Q57–A | Q58–A | Q59–C | Q60–A | Q61–A | Q62–B | Q63–A | Q64–C | Q65–C | Q66–C | Q67–C | Q68–D | Q69–D | Q70–A | Q71–A
