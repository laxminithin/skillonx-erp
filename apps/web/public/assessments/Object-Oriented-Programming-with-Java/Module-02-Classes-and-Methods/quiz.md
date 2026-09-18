# Quiz — Object Oriented Programming with Java — Module 2: Classes and Methods

**Subject:** Object Oriented Programming with Java  
**Module:** Module 2 — Classes and Methods  
**Questions:** 71  
**Mix:** 11 Easy · 34 Intermediate · 26 Difficult  
**Type:** Multiple choice (single correct option)  
**Instructions:** Choose the best option. Answers and short explanations follow each question.

---

### Q01  ·  Easy
**Question:** A constructor’s name must:

- **A.** Be init
- **B.** Be construct
- **C.** Match the class name
- **D.** Return void

**Answer:** C
**Explanation:** Constructors share the class name and have no return type.

### Q02  ·  Easy
**Question:** Which keyword refers to the current object?

- **A.** this
- **B.** class
- **C.** super
- **D.** static

**Answer:** A
**Explanation:** this is the current instance.

### Q03  ·  Easy
**Question:** Which option best describes **Class**?

- **A.** A running JVM process.
- **B.** A blueprint that defines fields and methods from which objects are created.
- **C.** A single stack frame.
- **D.** A .csv row.

**Answer:** B
**Explanation:** Class: A blueprint that defines fields and methods from which objects are created.

### Q04  ·  Easy
**Question:** Which option best describes **Instance method**?

- **A.** A method stored in the JDK only.
- **B.** A C function with no receiver.
- **C.** A method that cannot access fields.
- **D.** A method that operates on a specific object and may use this.

**Answer:** D
**Explanation:** Instance method: A method that operates on a specific object and may use this.

### Q05  ·  Easy
**Question:** Which option best describes **Method signature**?

- **A.** Only the method name.
- **B.** Only the return type.
- **C.** The method name plus the ordered parameter types (not the return type).
- **D.** The throws clause alone.

**Answer:** C
**Explanation:** Method signature: The method name plus the ordered parameter types (not the return type).

### Q06  ·  Easy
**Question:** Which option best describes **Pass-by-value**?

- **A.** Java passes copies of primitive values and copies of reference values; the caller’s variable is not rebound.
- **B.** Java is pass-by-reference for all parameters.
- **C.** Arrays are passed by copying every element.
- **D.** Java passes objects themselves so reassigning a parameter replaces the caller’s variable.

**Answer:** A
**Explanation:** Pass-by-value: Java passes copies of primitive values and copies of reference values; the caller’s variable is not rebound.

### Q07  ·  Easy
**Question:** Which option best describes **private**?

- **A.** Visible to the whole JAR by default.
- **B.** Visible only inside the declaring class (including nested types of that class).
- **C.** The same as protected.
- **D.** Visible to all subclasses in any package.

**Answer:** B
**Explanation:** private: Visible only inside the declaring class (including nested types of that class).

### Q08  ·  Easy
**Question:** Which option best describes **this**?

- **A.** A static reference to the Class object.
- **B.** The return address of main.
- **C.** A pointer to the superclass object only.
- **D.** A reference to the current instance, used to disambiguate fields or chain constructors.

**Answer:** D
**Explanation:** this: A reference to the current instance, used to disambiguate fields or chain constructors.

### Q09  ·  Easy
**Question:** Which sequence correctly describes **object creation**?

- **A.** load class → allocate heap → run constructor chain (super then this class) → return reference
- **B.** skip constructors if fields have defaults
- **C.** copy the .java file onto the heap
- **D.** run instance methods first → then allocate

**Answer:** A
**Explanation:** Correct sequence for object creation: load class → allocate heap → run constructor chain (super then this class) → return reference

### Q10  ·  Easy
**Question:** Which sequence correctly describes **overload resolution (simplified)**?

- **A.** always box then widen
- **B.** choose by return type first
- **C.** find applicable methods → choose most specific by identity/widening/boxing phase → compile error if ambiguous
- **D.** choose the method declared last in the file

**Answer:** C
**Explanation:** Correct sequence for overload resolution (simplified): find applicable methods → choose most specific by identity/widening/boxing phase → compile error if ambiguous

### Q11  ·  Easy
**Question:** private members are visible to:

- **A.** Subclasses in other packages
- **B.** Only the declaring class
- **C.** Any class in the same package
- **D.** Every JAR on the classpath

**Answer:** B
**Explanation:** private is class-private.

### Q12  ·  Intermediate
**Question:** If a class declares any constructor, the compiler:

- **A.** Adds a copy constructor
- **B.** Does not add a default constructor
- **C.** Makes all fields public
- **D.** Still always adds a public no-arg constructor

**Answer:** B
**Explanation:** Default constructor is withheld once you write one.

### Q13  ·  Intermediate
**Question:** Method setName(String name){ name = name; } fails to set the field because:

- **A.** Strings cannot be assigned
- **B.** Java forbids parameters named name
- **C.** The parameter shadows the field; use this.name = name
- **D.** Constructors are required

**Answer:** C
**Explanation:** Without this, both names refer to the parameter.

### Q14  ·  Intermediate
**Question:** Two methods: print(int) and print(double). Call print(2). Which runs?

- **A.** print(int)
- **B.** print(double)
- **C.** Both
- **D.** Neither; ambiguous

**Answer:** A
**Explanation:** Exact int match wins over widening to double.

### Q15  ·  Intermediate
**Question:** What is the most important distinction between **constructor** and **instance method**?

- **A.** You can invoke a constructor as obj.Student() later.
- **B.** Constructors return void explicitly.
- **C.** Methods are named after the class only.
- **D.** A constructor has no return type and is invoked by new; a method has a return type and is invoked on an existing object.

**Answer:** D
**Explanation:** A constructor has no return type and is invoked by new; a method has a return type and is invoked on an existing object.

### Q16  ·  Intermediate
**Question:** What is the most important distinction between **pass-by-value of a reference** and **pass-by-reference**?

- **A.** Primitives are passed by reference.
- **B.** The reference is copied; mutating the object is visible, rebinding the parameter is not.
- **C.** Array parameters copy all elements.
- **D.** Java rebinds the caller’s variable when the parameter is assigned.

**Answer:** B
**Explanation:** The reference is copied; mutating the object is visible, rebinding the parameter is not.

### Q17  ·  Intermediate
**Question:** What is the most important distinction between **static field** and **instance field**?

- **A.** One static copy per class; one instance field per object.
- **B.** Instance fields are shared by all objects.
- **C.** Static fields live inside each object separately.
- **D.** They occupy the same heap slot.

**Answer:** A
**Explanation:** One static copy per class; one instance field per object.

### Q18  ·  Intermediate
**Question:** What is the most important distinction between **this()** and **this.field**?

- **A.** They both allocate a new object.
- **B.** this.field can be used in static methods.
- **C.** this() can appear after other statements.
- **D.** this() chains to another constructor; this.field names an instance field.

**Answer:** D
**Explanation:** this() chains to another constructor; this.field names an instance field.

### Q19  ·  Intermediate
**Question:** Which option best describes **Access control**?

- **A.** A garbage-collection generation.
- **B.** public, protected, package-private (default) and private restrict who may use a member.
- **C.** The bytecode verifier’s only job.
- **D.** A JIT optimisation that inlines methods.

**Answer:** B
**Explanation:** Access control: public, protected, package-private (default) and private restrict who may use a member.

### Q20  ·  Intermediate
**Question:** Which option best describes **Constructor**?

- **A.** A special method invoked with new to initialise a new instance.
- **B.** A static factory that cannot assign fields.
- **C.** The finalize method.
- **D.** A method that must return int.

**Answer:** A
**Explanation:** Constructor: A special method invoked with new to initialise a new instance.

### Q21  ·  Intermediate
**Question:** Which option best describes **Default constructor**?

- **A.** The copy constructor C++ would generate.
- **B.** A no-arg constructor the compiler supplies only if you declare none.
- **C.** Always present even if you write other constructors.
- **D.** A constructor that always sets every field to null even for int.

**Answer:** B
**Explanation:** Default constructor: A no-arg constructor the compiler supplies only if you declare none.

### Q22  ·  Intermediate
**Question:** Which option best describes **Inner class**?

- **A.** A static nested class with no enclosing instance.
- **B.** A non-static nested class that holds an implicit reference to an enclosing instance.
- **C.** A package-info file.
- **D.** An anonymous array.

**Answer:** B
**Explanation:** Inner class: A non-static nested class that holds an implicit reference to an enclosing instance.

### Q23  ·  Intermediate
**Question:** Which option best describes **Method overloading**?

- **A.** Several methods in one class sharing a name but differing in parameter lists.
- **B.** Changing a method’s access after compilation.
- **C.** Two methods that differ only in return type.
- **D.** Overriding a superclass method.

**Answer:** A
**Explanation:** Method overloading: Several methods in one class sharing a name but differing in parameter lists.

### Q24  ·  Intermediate
**Question:** Which option best describes **Nested class**?

- **A.** An interface in the default package.
- **B.** A subclass in another file only.
- **C.** A class declared inside another class, static or inner (non-static).
- **D.** A local variable of class type.

**Answer:** C
**Explanation:** Nested class: A class declared inside another class, static or inner (non-static).

### Q25  ·  Intermediate
**Question:** Which option best describes **Object**?

- **A.** A primitive int.
- **B.** The javac process.
- **C.** The .java file on disk.
- **D.** A heap instance of a class with its own state and identity.

**Answer:** D
**Explanation:** Object: A heap instance of a class with its own state and identity.

### Q26  ·  Intermediate
**Question:** Which option best describes **new**?

- **A.** A keyword that loads a .java file into javac.
- **B.** A synonym for malloc that skips constructors.
- **C.** The operator that allocates a heap object and runs a constructor.
- **D.** A stack allocation of primitives only.

**Answer:** C
**Explanation:** new: The operator that allocates a heap object and runs a constructor.

### Q27  ·  Intermediate
**Question:** Which option best describes **package-private**?

- **A.** Default access: visible inside the same package, not to subclasses in other packages.
- **B.** Visible to the entire world.
- **C.** Visible only in the same class.
- **D.** Visible to subclasses everywhere, hidden in-package.

**Answer:** A
**Explanation:** package-private: Default access: visible inside the same package, not to subclasses in other packages.

### Q28  ·  Intermediate
**Question:** Which option best describes **static field**?

- **A.** A class-level variable shared by all instances, not stored per object.
- **B.** A field copied into every object as a distinct copy that cannot be shared.
- **C.** A local variable in main.
- **D.** A constant that must be reallocated with new.

**Answer:** A
**Explanation:** static field: A class-level variable shared by all instances, not stored per object.

### Q29  ·  Intermediate
**Question:** Which option best describes **static method**?

- **A.** A constructor.
- **B.** A method invoked on the class, with no implicit this, unable to use instance members directly.
- **C.** A method that must be overridden.
- **D.** A method that can use this freely.

**Answer:** B
**Explanation:** static method: A method invoked on the class, with no implicit this, unable to use instance members directly.

### Q30  ·  Intermediate
**Question:** Which option best describes **static nested class**?

- **A.** A local class inside a method.
- **B.** A class that must be private.
- **C.** An inner class that requires Outer.this.
- **D.** A nested class that does not capture an enclosing instance and can be used like a top-level class.

**Answer:** D
**Explanation:** static nested class: A nested class that does not capture an enclosing instance and can be used like a top-level class.

### Q31  ·  Intermediate
**Question:** Which pair overloads correctly?

- **A.** int f(); double f();
- **B.** void f(int x); void f(double x);
- **C.** void f(int x); void f(int y);
- **D.** void f(int x); int f(int x);

**Answer:** B
**Explanation:** Parameter lists must differ; return type alone is not enough.

### Q32  ·  Intermediate
**Question:** Which sequence correctly describes **constructor chaining with this()**?

- **A.** super() and this() in the same constructor
- **B.** this() after field assignments
- **C.** this(...) as first statement → that constructor → then the rest of the calling constructor body
- **D.** this() from an instance method

**Answer:** C
**Explanation:** Correct sequence for constructor chaining with this(): this(...) as first statement → that constructor → then the rest of the calling constructor body

### Q33  ·  Intermediate
**Question:** Which sequence correctly describes **passing a mutable object to a method**?

- **A.** callee assignment overwrites the caller’s variable
- **B.** deep-copy the object automatically
- **C.** copy the reference → callee may mutate fields/array slots → rebinding the parameter does not affect caller
- **D.** primitives are shared by reference

**Answer:** C
**Explanation:** Correct sequence for passing a mutable object to a method: copy the reference → callee may mutate fields/array slots → rebinding the parameter does not affect caller

### Q34  ·  Intermediate
**Question:** Which statement about **Class** is FALSE?

- **A.** Class is correctly understood as: a blueprint that defines fields and methods from which objects are created.
- **B.** A useful way to remember Class is that it is not the same as “A running JVM process”.
- **C.** A class is the object sitting on the heap; an object is the source file.
- **D.** In this module, Class is a core idea students must distinguish from nearby terms.

**Answer:** C
**Explanation:** The false claim is: A class is the object sitting on the heap; an object is the source file.. Class actually means: A blueprint that defines fields and methods from which objects are created.

### Q35  ·  Intermediate
**Question:** Which statement about **Constructor** is FALSE?

- **A.** Constructor is correctly understood as: a special method invoked with new to initialise a new instance.
- **B.** In this module, Constructor is a core idea students must distinguish from nearby terms.
- **C.** A constructor is inherited and can be called as obj.ClassName() on an existing object.
- **D.** A useful way to remember Constructor is that it is not the same as “A method that must return int”.

**Answer:** C
**Explanation:** The false claim is: A constructor is inherited and can be called as obj.ClassName() on an existing object.. Constructor actually means: A special method invoked with new to initialise a new instance.

### Q36  ·  Intermediate
**Question:** Which statement about **Default constructor** is FALSE?

- **A.** If you write only Student(String n), new Student() still compiles via a default constructor.
- **B.** Default constructor is correctly understood as: a no-arg constructor the compiler supplies only if you declare none.
- **C.** A useful way to remember Default constructor is that it is not the same as “A constructor that always sets every field to null even for int”.
- **D.** In this module, Default constructor is a core idea students must distinguish from nearby terms.

**Answer:** A
**Explanation:** The false claim is: If you write only Student(String n), new Student() still compiles via a default constructor.. Default constructor actually means: A no-arg constructor the compiler supplies only if you declare none.

### Q37  ·  Intermediate
**Question:** Which statement about **Method overloading** is FALSE?

- **A.** Method overloading is correctly understood as: several methods in one class sharing a name but differing in parameter lists.
- **B.** Overloading is decided only by return type, not by parameters.
- **C.** In this module, Method overloading is a core idea students must distinguish from nearby terms.
- **D.** A useful way to remember Method overloading is that it is not the same as “Two methods that differ only in return type”.

**Answer:** B
**Explanation:** The false claim is: Overloading is decided only by return type, not by parameters.. Method overloading actually means: Several methods in one class sharing a name but differing in parameter lists.

### Q38  ·  Intermediate
**Question:** Which statement about **Nested class** is FALSE?

- **A.** A useful way to remember Nested class is that it is not the same as “A subclass in another file only”.
- **B.** Java forbids declaring a class inside another class.
- **C.** Nested class is correctly understood as: a class declared inside another class, static or inner (non-static).
- **D.** In this module, Nested class is a core idea students must distinguish from nearby terms.

**Answer:** B
**Explanation:** The false claim is: Java forbids declaring a class inside another class.. Nested class actually means: A class declared inside another class, static or inner (non-static).

### Q39  ·  Intermediate
**Question:** Which statement about **Pass-by-value** is FALSE?

- **A.** Assigning a parameter to a new object updates the caller’s reference.
- **B.** A useful way to remember Pass-by-value is that it is not the same as “Java passes objects themselves so reassigning a parameter replaces the caller’s variable”.
- **C.** Pass-by-value is correctly understood as: java passes copies of primitive values and copies of reference values; the caller’s variable is not rebound.
- **D.** In this module, Pass-by-value is a core idea students must distinguish from nearby terms.

**Answer:** A
**Explanation:** The false claim is: Assigning a parameter to a new object updates the caller’s reference.. Pass-by-value actually means: Java passes copies of primitive values and copies of reference values; the caller’s variable is not rebound.

### Q40  ·  Intermediate
**Question:** Which statement about **package-private** is FALSE?

- **A.** In this module, package-private is a core idea students must distinguish from nearby terms.
- **B.** Default access is more visible than public.
- **C.** A useful way to remember package-private is that it is not the same as “Visible to the entire world”.
- **D.** package-private is correctly understood as: default access: visible inside the same package, not to subclasses in other packages.

**Answer:** B
**Explanation:** The false claim is: Default access is more visible than public.. package-private actually means: Default access: visible inside the same package, not to subclasses in other packages.

### Q41  ·  Intermediate
**Question:** Which statement about **private** is FALSE?

- **A.** private fields can be read by any class that imports the package.
- **B.** private is correctly understood as: visible only inside the declaring class (including nested types of that class).
- **C.** In this module, private is a core idea students must distinguish from nearby terms.
- **D.** A useful way to remember private is that it is not the same as “Visible to all subclasses in any package”.

**Answer:** A
**Explanation:** The false claim is: private fields can be read by any class that imports the package.. private actually means: Visible only inside the declaring class (including nested types of that class).

### Q42  ·  Intermediate
**Question:** Which statement about **static method** is FALSE?

- **A.** A useful way to remember static method is that it is not the same as “A method that must be overridden”.
- **B.** static method is correctly understood as: a method invoked on the class, with no implicit this, unable to use instance members directly.
- **C.** In this module, static method is a core idea students must distinguish from nearby terms.
- **D.** static methods can refer to instance fields without an object reference.

**Answer:** D
**Explanation:** The false claim is: static methods can refer to instance fields without an object reference.. static method actually means: A method invoked on the class, with no implicit this, unable to use instance members directly.

### Q43  ·  Intermediate
**Question:** You declare Student(String n) only. A tester writes new Student(); The result is:

- **A.** Compile error: no default constructor is generated
- **B.** The Object constructor fills n
- **C.** A Student with n=""
- **D.** Runtime NullPointerException

**Answer:** A
**Explanation:** Declaring any constructor suppresses the default.

### Q44  ·  Intermediate
**Question:** You need a helper type inside HashMap-style code that does not need the outer map instance. Prefer:

- **A.** local class in a static method that captures this
- **B.** inner class
- **C.** static nested class
- **D.** anonymous inner class that uses Outer.this

**Answer:** C
**Explanation:** Static nested avoids a hidden outer reference.

### Q45  ·  Intermediate
**Question:** static int n=0; in a class means:

- **A.** One n is shared by the class
- **B.** n cannot be incremented
- **C.** n is a local variable of main
- **D.** Each object stores its own n

**Answer:** A
**Explanation:** static fields are class-wide.

### Q46  ·  Difficult
**Question:** A GUI listener is a one-off and needs the enclosing Frame instance. Typical choice:

- **A.** A new top-level class in another package with private outer fields
- **B.** A primitive array
- **C.** Anonymous inner class (or lambda) capturing the outer instance
- **D.** static nested class with no outer pointer

**Answer:** C
**Explanation:** Inner/anonymous classes hold the outer this.

### Q47  ·  Difficult
**Question:** A class has methods m(int), m(long), m(Integer). The call m(5) binds to:

- **A.** m(long)
- **B.** m(Integer)
- **C.** It is a compile error
- **D.** m(int)

**Answer:** D
**Explanation:** The literal 5 is int; exact match beats widening and boxing.

### Q48  ·  Difficult
**Question:** A static method needs the name of the current object. The correct approach is:

- **A.** Use Class.this in a static nested class without an instance
- **B.** Use super.name from static
- **C.** Pass the object as a parameter; do not use this in static code
- **D.** Use this.name

**Answer:** C
**Explanation:** static context has no this.

### Q49  ·  Difficult
**Question:** An inner class instance is created from instance method of Outer as:

- **A.** new Inner() using the current Outer.this
- **B.** Inner.new() without an outer
- **C.** Outer.Inner.alloc()
- **D.** static new Inner()

**Answer:** A
**Explanation:** Non-static inner classes are qualified by an enclosing instance.

### Q50  ·  Difficult
**Question:** Counter objects each print the total number of Counters created. Store that total as:

- **A.** a method parameter
- **B.** an instance int that starts at 0 in each object independently as the ‘total’
- **C.** a local variable in toString
- **D.** a private static int incremented in each constructor

**Answer:** D
**Explanation:** Shared tally belongs in a static field.

### Q51  ·  Difficult
**Question:** Fields of a class should not be mutated by other packages except via methods. Use:

- **A.** private fields and public accessors
- **B.** protected fields for the world
- **C.** default access and hope
- **D.** public fields

**Answer:** A
**Explanation:** Encapsulation uses private + methods.

### Q52  ·  Difficult
**Question:** How many bits does a Java int occupy?

- **A.** 8
- **B.** 64
- **C.** 32
- **D.** 16

**Answer:** C
**Explanation:** int is a 32-bit two’s-complement primitive.

### Q53  ·  Difficult
**Question:** What is the most important distinction between **default constructor** and **explicit no-arg constructor**?

- **A.** You cannot write a no-arg constructor yourself.
- **B.** They differ only in bytecode version.
- **C.** The default still appears if you declare Student(int x).
- **D.** The default exists only if no constructor is declared; an explicit no-arg you write yourself always exists if declared.

**Answer:** D
**Explanation:** The default exists only if no constructor is declared; an explicit no-arg you write yourself always exists if declared.

### Q54  ·  Difficult
**Question:** What is the most important distinction between **inner class** and **static nested class**?

- **A.** They are both constructed with new Outer.Inner() from a static main without an Outer.
- **B.** Static nested always holds Outer.this.
- **C.** Inner classes cannot access outer instance members.
- **D.** Inner needs an enclosing instance; static nested does not.

**Answer:** D
**Explanation:** Inner needs an enclosing instance; static nested does not.

### Q55  ·  Difficult
**Question:** What is the most important distinction between **overloading** and **overriding**?

- **A.** They are the same compile-time rule.
- **B.** Overriding changes only the parameter list.
- **C.** Overloading is same name, different parameters in one type; overriding replaces a superclass instance method.
- **D.** Overloading requires @Override.

**Answer:** C
**Explanation:** Overloading is same name, different parameters in one type; overriding replaces a superclass instance method.

### Q56  ·  Difficult
**Question:** What is the most important distinction between **private** and **public**?

- **A.** public is class-only.
- **B.** private is package-wide.
- **C.** private is class-only; public is visible everywhere the type is visible.
- **D.** They are identical in the same JAR.

**Answer:** C
**Explanation:** private is class-only; public is visible everywhere the type is visible.

### Q57  ·  Difficult
**Question:** Which statement about **Access control** is FALSE?

- **A.** private members of a class are visible to every class in the same package.
- **B.** Access control is correctly understood as: public, protected, package-private (default) and private restrict who may use a member.
- **C.** A useful way to remember Access control is that it is not the same as “A JIT optimisation that inlines methods”.
- **D.** In this module, Access control is a core idea students must distinguish from nearby terms.

**Answer:** A
**Explanation:** The false claim is: private members of a class are visible to every class in the same package.. Access control actually means: public, protected, package-private (default) and private restrict who may use a member.

### Q58  ·  Difficult
**Question:** Which statement about **Inner class** is FALSE?

- **A.** In this module, Inner class is a core idea students must distinguish from nearby terms.
- **B.** An inner class can be constructed as new Inner() from a static context with no outer object.
- **C.** Inner class is correctly understood as: a non-static nested class that holds an implicit reference to an enclosing instance.
- **D.** A useful way to remember Inner class is that it is not the same as “A static nested class with no enclosing instance”.

**Answer:** B
**Explanation:** The false claim is: An inner class can be constructed as new Inner() from a static context with no outer object.. Inner class actually means: A non-static nested class that holds an implicit reference to an enclosing instance.

### Q59  ·  Difficult
**Question:** Which statement about **Instance method** is FALSE?

- **A.** A useful way to remember Instance method is that it is not the same as “A method that cannot access fields”.
- **B.** In this module, Instance method is a core idea students must distinguish from nearby terms.
- **C.** Instance methods can be called as ClassName.method() without an object.
- **D.** Instance method is correctly understood as: a method that operates on a specific object and may use this.

**Answer:** C
**Explanation:** The false claim is: Instance methods can be called as ClassName.method() without an object.. Instance method actually means: A method that operates on a specific object and may use this.

### Q60  ·  Difficult
**Question:** Which statement about **Method signature** is FALSE?

- **A.** Two methods that differ only in return type are a valid overload pair.
- **B.** Method signature is correctly understood as: the method name plus the ordered parameter types (not the return type).
- **C.** In this module, Method signature is a core idea students must distinguish from nearby terms.
- **D.** A useful way to remember Method signature is that it is not the same as “Only the return type”.

**Answer:** A
**Explanation:** The false claim is: Two methods that differ only in return type are a valid overload pair.. Method signature actually means: The method name plus the ordered parameter types (not the return type).

### Q61  ·  Difficult
**Question:** Which statement about **Object** is FALSE?

- **A.** In this module, Object is a core idea students must distinguish from nearby terms.
- **B.** Object is correctly understood as: a heap instance of a class with its own state and identity.
- **C.** Two new Student() expressions always yield the same object identity.
- **D.** A useful way to remember Object is that it is not the same as “The .java file on disk”.

**Answer:** C
**Explanation:** The false claim is: Two new Student() expressions always yield the same object identity.. Object actually means: A heap instance of a class with its own state and identity.

### Q62  ·  Difficult
**Question:** Which statement about **new** is FALSE?

- **A.** new on a class does not call any constructor.
- **B.** A useful way to remember new is that it is not the same as “A keyword that loads a .java file into javac”.
- **C.** In this module, new is a core idea students must distinguish from nearby terms.
- **D.** new is correctly understood as: the operator that allocates a heap object and runs a constructor.

**Answer:** A
**Explanation:** The false claim is: new on a class does not call any constructor.. new actually means: The operator that allocates a heap object and runs a constructor.

### Q63  ·  Difficult
**Question:** Which statement about **static field** is FALSE?

- **A.** Each object gets a separate copy of a static field that other objects cannot see.
- **B.** In this module, static field is a core idea students must distinguish from nearby terms.
- **C.** A useful way to remember static field is that it is not the same as “A field copied into every object as a distinct copy that cannot be shared”.
- **D.** static field is correctly understood as: a class-level variable shared by all instances, not stored per object.

**Answer:** A
**Explanation:** The false claim is: Each object gets a separate copy of a static field that other objects cannot see.. static field actually means: A class-level variable shared by all instances, not stored per object.

### Q64  ·  Difficult
**Question:** Which statement about **static nested class** is FALSE?

- **A.** In this module, static nested class is a core idea students must distinguish from nearby terms.
- **B.** A useful way to remember static nested class is that it is not the same as “An inner class that requires Outer.this”.
- **C.** A static nested class cannot be instantiated without an Outer object.
- **D.** static nested class is correctly understood as: a nested class that does not capture an enclosing instance and can be used like a top-level class.

**Answer:** C
**Explanation:** The false claim is: A static nested class cannot be instantiated without an Outer object.. static nested class actually means: A nested class that does not capture an enclosing instance and can be used like a top-level class.

### Q65  ·  Difficult
**Question:** Which statement about **this** is FALSE?

- **A.** this can be used inside a static method to access instance fields.
- **B.** A useful way to remember this is that it is not the same as “A pointer to the superclass object only”.
- **C.** this is correctly understood as: a reference to the current instance, used to disambiguate fields or chain constructors.
- **D.** In this module, this is a core idea students must distinguish from nearby terms.

**Answer:** A
**Explanation:** The false claim is: this can be used inside a static method to access instance fields.. this actually means: A reference to the current instance, used to disambiguate fields or chain constructors.

### Q66  ·  Difficult
**Question:** Why is void swap(Point a, Point b){ Point t=a; a=b; b=t; } unable to swap the caller’s two variables?

- **A.** swap must be static
- **B.** new is required inside swap
- **C.** Java passes copies of the references, so rebinding a and b is local
- **D.** Point is immutable

**Answer:** C
**Explanation:** The caller still holds the original two references.

### Q67  ·  Difficult
**Question:** class Box { int v; } void rebind(Box b){ b = new Box(); b.v=9; } Box x=new Box(); x.v=1; rebind(x); What is x.v?

- **A.** null
- **B.** 1
- **C.** 9
- **D.** 0

**Answer:** B
**Explanation:** rebind copies the reference then points the copy at a new Box; x still refers to the original with v=1.

### Q68  ·  Difficult
**Question:** class C { static int n; C(){ n++; } } After new C(); new C(); new C(); what is C.n?

- **A.** 2
- **B.** 0
- **C.** 1
- **D.** 3

**Answer:** D
**Explanation:** Each constructor increments the shared static; three objects ⇒ n=3.

### Q69  ·  Difficult
**Question:** int[] a = {1,2,3}; void f(int[] p){ p[0]=9; p=new int[]{7}; } After f(a), a[0] is:

- **A.** 0
- **B.** 9
- **C.** 1
- **D.** 7

**Answer:** B
**Explanation:** p[0]=9 mutates the array; p=new int[] only rebinds the parameter. a[0] is 9.

### Q70  ·  Difficult
**Question:** void bump(Box b){ b.v++; } Box x=new Box(); x.v=4; bump(x); What is x.v?

- **A.** 5
- **B.** 6
- **C.** 4
- **D.** 0

**Answer:** A
**Explanation:** The copied reference still points at the same object, so the field mutation is visible: 5.

### Q71  ·  Difficult
**Question:** void swap(int a,int b){ int t=a; a=b; b=t; } With x=3,y=5, swap(x,y); what are x and y?

- **A.** 5 and 5
- **B.** 3 and 5
- **C.** 5 and 3
- **D.** 0 and 0

**Answer:** B
**Explanation:** Primitives are copied; swap does not change the caller’s x and y.

---

## Quick answer key

Q01–C | Q02–A | Q03–B | Q04–D | Q05–C | Q06–A | Q07–B | Q08–D | Q09–A | Q10–C | Q11–B | Q12–B | Q13–C | Q14–A | Q15–D | Q16–B | Q17–A | Q18–D | Q19–B | Q20–A | Q21–B | Q22–B | Q23–A | Q24–C | Q25–D | Q26–C | Q27–A | Q28–A | Q29–B | Q30–D | Q31–B | Q32–C | Q33–C | Q34–C | Q35–C | Q36–A | Q37–B | Q38–B | Q39–A | Q40–B | Q41–A | Q42–D | Q43–A | Q44–C | Q45–A | Q46–C | Q47–D | Q48–C | Q49–A | Q50–D | Q51–A | Q52–C | Q53–D | Q54–D | Q55–C | Q56–C | Q57–A | Q58–B | Q59–C | Q60–A | Q61–C | Q62–A | Q63–A | Q64–C | Q65–A | Q66–C | Q67–B | Q68–D | Q69–B | Q70–A | Q71–B
