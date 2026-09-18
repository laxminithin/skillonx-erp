# Quiz — Object Oriented Programming with Java — Module 3: Inheritance, Packages and Interfaces

**Subject:** Object Oriented Programming with Java  
**Module:** Module 3 — Inheritance, Packages and Interfaces  
**Questions:** 71  
**Mix:** 11 Easy · 34 Intermediate · 26 Difficult  
**Type:** Multiple choice (single correct option)  
**Instructions:** Choose the best option. Answers and short explanations follow each question.

---

### Q01  ·  Easy
**Question:** An abstract class can contain:

- **A.** Only static methods
- **B.** A mix of abstract and concrete methods, and fields
- **C.** Only abstract methods
- **D.** No constructors

**Answer:** B
**Explanation:** Abstract classes may have state, constructors and concrete methods.

### Q02  ·  Easy
**Question:** Every Java class (except Object) has how many direct superclasses?

- **A.** One
- **B.** Three
- **C.** Two
- **D.** Zero

**Answer:** A
**Explanation:** Single inheritance of classes.

### Q03  ·  Easy
**Question:** Which class is the root of the Java class hierarchy?

- **A.** String
- **B.** Class
- **C.** Object
- **D.** System

**Answer:** C
**Explanation:** java.lang.Object.

### Q04  ·  Easy
**Question:** Which option best describes **Dynamic dispatch**?

- **A.** A rule that static methods are virtual.
- **B.** Inlining that freezes the first loaded subclass.
- **C.** The compiler always binds instance methods using only the variable’s declared type.
- **D.** The JVM selects the overridden instance method using the runtime type of the object.

**Answer:** D
**Explanation:** Dynamic dispatch: The JVM selects the overridden instance method using the runtime type of the object.

### Q05  ·  Easy
**Question:** Which option best describes **Package**?

- **A.** The JVM heap generation.
- **B.** A namespace grouping related types, typically mapped to a directory, declared with package.
- **C.** A C++ namespace keyword that Java forbids.
- **D.** A JAR file’s only mandatory name.

**Answer:** B
**Explanation:** Package: A namespace grouping related types, typically mapped to a directory, declared with package.

### Q06  ·  Easy
**Question:** Which option best describes **default method**?

- **A.** An interface method with a body, inherited by implementors unless overridden (Java 8+).
- **B.** The default constructor of Object.
- **C.** A static method on a class.
- **D.** A package-private class method.

**Answer:** A
**Explanation:** default method: An interface method with a body, inherited by implementors unless overridden (Java 8+).

### Q07  ·  Easy
**Question:** Which option best describes **extends**?

- **A.** A class inheriting two concrete superclasses.
- **B.** A class inherits fields and methods of one superclass (single class inheritance).
- **C.** An import of static methods only.
- **D.** A package declaration.

**Answer:** B
**Explanation:** extends: A class inherits fields and methods of one superclass (single class inheritance).

### Q08  ·  Easy
**Question:** Which option best describes **protected**?

- **A.** Identical to public.
- **B.** Hidden from subclasses.
- **C.** Visible only in the same class.
- **D.** Visible in the same package and to subclasses (with extra rules for instance access across packages).

**Answer:** D
**Explanation:** protected: Visible in the same package and to subclasses (with extra rules for instance access across packages).

### Q09  ·  Easy
**Question:** Which option best describes **toString**?

- **A.** A constructor of String.
- **B.** A static method of System.
- **C.** An Object method returning a string view; override it for readable objects.
- **D.** A package name.

**Answer:** C
**Explanation:** toString: An Object method returning a string view; override it for readable objects.

### Q10  ·  Easy
**Question:** Which sequence correctly describes **constructor chain in inheritance**?

- **A.** new Sub → Sub constructor starts → super() chain to Object → then instance inits returning down to Sub body
- **B.** Interfaces run constructors first
- **C.** Only Object constructor runs
- **D.** Sub body → then Object constructor

**Answer:** A
**Explanation:** Correct sequence for constructor chain in inheritance: new Sub → Sub constructor starts → super() chain to Object → then instance inits returning down to Sub body

### Q11  ·  Easy
**Question:** Which sequence correctly describes **implementing an interface**?

- **A.** copy I’s source into the class
- **B.** new I() with a constructor in the interface (no anonymous class)
- **C.** class declares implements I → provide bodies for abstract methods → instances are usable as type I
- **D.** extend I as a class

**Answer:** C
**Explanation:** Correct sequence for implementing an interface: class declares implements I → provide bodies for abstract methods → instances are usable as type I

### Q12  ·  Intermediate
**Question:** @Override on a method that only changes the parameter type is:

- **A.** A compile error because it is overloading, not overriding
- **B.** Used for constructors
- **C.** Required for overloading
- **D.** Valid overriding

**Answer:** A
**Explanation:** @Override fails if the signature does not match a superclass instance method.

### Q13  ·  Intermediate
**Question:** A constructor of Child does not call super(...) explicitly. Then:

- **A.** The compiler inserts super() as the first statement
- **B.** Object is skipped
- **C.** Parent constructors never run
- **D.** this() is inserted instead

**Answer:** A
**Explanation:** Implicit super() requires a visible no-arg parent constructor.

### Q14  ·  Intermediate
**Question:** Protected members in package p1 are visible in a subclass in p2:

- **A.** Never
- **B.** Through inheritance on the subclass instance, not freely on arbitrary Parent objects from other packages
- **C.** Only if public
- **D.** As if they were public to the whole world

**Answer:** B
**Explanation:** Cross-package protected is tied to subclass access, not global public.

### Q15  ·  Intermediate
**Question:** Shape s = new Circle(); s.area() should use Circle’s formula. This is:

- **A.** Dynamic dispatch of an overridden instance method
- **B.** Package import
- **C.** Constructor chaining only
- **D.** Static hiding

**Answer:** A
**Explanation:** Runtime type Circle selects Circle.area().

### Q16  ·  Intermediate
**Question:** Types in package vtu.lab vs vtu.exam: default-access field of a class in vtu.lab is visible to:

- **A.** The whole world
- **B.** All of vtu.* 
- **C.** Other types in vtu.lab only, not vtu.exam
- **D.** Subclasses in vtu.exam

**Answer:** C
**Explanation:** Default access is same-package only.

### Q17  ·  Intermediate
**Question:** What is the most important distinction between **abstract class** and **interface**?

- **A.** They are identical since Java 8.
- **B.** Interfaces can declare instance fields that are not public static final.
- **C.** Abstract classes allow multiple class inheritance.
- **D.** A class can extend one abstract class but implement many interfaces; abstract classes may hold state and constructors.

**Answer:** D
**Explanation:** A class can extend one abstract class but implement many interfaces; abstract classes may hold state and constructors.

### Q18  ·  Intermediate
**Question:** What is the most important distinction between **default method** and **abstract method in an interface**?

- **A.** Default methods are private.
- **B.** default has a body and is optional to override; abstract has no body and must be implemented (unless the class is abstract).
- **C.** You must implement default methods.
- **D.** Abstract interface methods have bodies in Java 8.

**Answer:** B
**Explanation:** default has a body and is optional to override; abstract has no body and must be implemented (unless the class is abstract).

### Q19  ·  Intermediate
**Question:** What is the most important distinction between **extends** and **implements**?

- **A.** They are interchangeable.
- **B.** An interface extends a class.
- **C.** A class implements another class.
- **D.** extends is for a class/interface parent; implements is a class taking on interfaces.

**Answer:** D
**Explanation:** extends is for a class/interface parent; implements is a class taking on interfaces.

### Q20  ·  Intermediate
**Question:** What is the most important distinction between **super()** and **this()**?

- **A.** super() invokes the superclass constructor; this() invokes another constructor of this class. Only one of them can be first.
- **B.** Both can appear in one constructor.
- **C.** super() can be written after assignments.
- **D.** this() calls the parent class.

**Answer:** A
**Explanation:** super() invokes the superclass constructor; this() invokes another constructor of this class. Only one of them can be first.

### Q21  ·  Intermediate
**Question:** Which is legal?

- **A.** class A extends B, C {}
- **B.** class A implements I, J {}
- **C.** interface I extends class A {}
- **D.** class A extends I, J {}

**Answer:** B
**Explanation:** Multiple interfaces, one class parent.

### Q22  ·  Intermediate
**Question:** Which option best describes **Access protection**?

- **A.** The only job of the garbage collector.
- **B.** public/protected/default/private interact with packages and subclasses to hide implementation.
- **C.** A firewall in the JRE.
- **D.** A switch on module-info only.

**Answer:** B
**Explanation:** Access protection: public/protected/default/private interact with packages and subclasses to hide implementation.

### Q23  ·  Intermediate
**Question:** Which option best describes **Interface**?

- **A.** A package-info only.
- **B.** A class you instantiate with new on the interface name when it has no default methods.
- **C.** A reference type whose abstract instance methods a class can implement (multiple interfaces allowed).
- **D.** A primitive type.

**Answer:** C
**Explanation:** Interface: A reference type whose abstract instance methods a class can implement (multiple interfaces allowed).

### Q24  ·  Intermediate
**Question:** Which option best describes **Method overriding**?

- **A.** A subclass instance method with the same signature and compatible return replacing the superclass one.
- **B.** A constructor in the subclass.
- **C.** A static method hiding with @Override required.
- **D.** A method with a different parameter list in the same class.

**Answer:** A
**Explanation:** Method overriding: A subclass instance method with the same signature and compatible return replacing the superclass one.

### Q25  ·  Intermediate
**Question:** Which option best describes **Object class**?

- **A.** The superclass of primitives.
- **B.** The root of the class hierarchy; every class extends Object directly or indirectly.
- **C.** An interface in java.lang.
- **D.** A class only strings extend.

**Answer:** B
**Explanation:** Object class: The root of the class hierarchy; every class extends Object directly or indirectly.

### Q26  ·  Intermediate
**Question:** Which option best describes **abstract class**?

- **A.** A class that may contain abstract methods and cannot be instantiated with new.
- **B.** A class that cannot be extended.
- **C.** A class that must have only private constructors.
- **D.** An interface compiled as a class file named abstract.

**Answer:** A
**Explanation:** abstract class: A class that may contain abstract methods and cannot be instantiated with new.

### Q27  ·  Intermediate
**Question:** Which option best describes **abstract method**?

- **A.** A static method in Object.
- **B.** A method without a body that subclasses (or further abstracts) must implement.
- **C.** A private method with an empty body.
- **D.** A method marked final.

**Answer:** B
**Explanation:** abstract method: A method without a body that subclasses (or further abstracts) must implement.

### Q28  ·  Intermediate
**Question:** Which option best describes **equals / hashCode**?

- **A.** Object identity-based by default; contracts require overriding both if value equality is needed.
- **B.** Methods that compare class names only.
- **C.** Required overrides in every class.
- **D.** Operators == and !=.

**Answer:** A
**Explanation:** equals / hashCode: Object identity-based by default; contracts require overriding both if value equality is needed.

### Q29  ·  Intermediate
**Question:** Which option best describes **final class**?

- **A.** An interface.
- **B.** A class with only abstract methods.
- **C.** A class that cannot be instantiated.
- **D.** A class that cannot be subclassed.

**Answer:** D
**Explanation:** final class: A class that cannot be subclassed.

### Q30  ·  Intermediate
**Question:** Which option best describes **implements**?

- **A.** The keyword to extend a class.
- **B.** The clause listing interfaces whose contracts a class agrees to fulfil.
- **C.** A constructor call.
- **D.** A package import.

**Answer:** B
**Explanation:** implements: The clause listing interfaces whose contracts a class agrees to fulfil.

### Q31  ·  Intermediate
**Question:** Which option best describes **import**?

- **A.** A compile-time convenience to name types without the full package prefix.
- **B.** A runtime copy of another class’s bytecode into yours.
- **C.** A C #include of source text.
- **D.** A keyword that breaks encapsulation.

**Answer:** A
**Explanation:** import: A compile-time convenience to name types without the full package prefix.

### Q32  ·  Intermediate
**Question:** Which option best describes **static interface method**?

- **A.** A method called on this inside the implementing class automatically.
- **B.** A private constructor.
- **C.** A helper invoked as InterfaceName.method, not inherited as an instance method on implementors.
- **D.** A default method.

**Answer:** C
**Explanation:** static interface method: A helper invoked as InterfaceName.method, not inherited as an instance method on implementors.

### Q33  ·  Intermediate
**Question:** Which option best describes **super**?

- **A.** The current package name.
- **B.** A keyword that creates a subclass.
- **C.** A synonym for this in static methods.
- **D.** A reference used to call a superclass constructor or hidden/overridden members.

**Answer:** D
**Explanation:** super: A reference used to call a superclass constructor or hidden/overridden members.

### Q34  ·  Intermediate
**Question:** Which sequence correctly describes **dynamic dispatch**?

- **A.** static binding for all public methods
- **B.** compiler bakes the superclass method forever
- **C.** compiler records invokevirtual/invokeinterface → JVM uses runtime class’s vtable/itable → most specific override runs
- **D.** JIT deletes overrides

**Answer:** C
**Explanation:** Correct sequence for dynamic dispatch: compiler records invokevirtual/invokeinterface → JVM uses runtime class’s vtable/itable → most specific override runs

### Q35  ·  Intermediate
**Question:** Which sequence correctly describes **package use**?

- **A.** import required inside the same package
- **B.** package last in the file
- **C.** package declaration first in file → types live in that namespace → others import or use FQCN
- **D.** directory can disagree with package with no tools issue

**Answer:** C
**Explanation:** Correct sequence for package use: package declaration first in file → types live in that namespace → others import or use FQCN

### Q36  ·  Intermediate
**Question:** Which statement about **Access protection** is FALSE?

- **A.** A useful way to remember Access protection is that it is not the same as “A firewall in the JRE”.
- **B.** Access protection is correctly understood as: public/protected/default/private interact with packages and subclasses to hide implementation.
- **C.** In this module, Access protection is a core idea students must distinguish from nearby terms.
- **D.** protected members are visible to all classes in all packages.

**Answer:** D
**Explanation:** The false claim is: protected members are visible to all classes in all packages.. Access protection actually means: public/protected/default/private interact with packages and subclasses to hide implementation.

### Q37  ·  Intermediate
**Question:** Which statement about **Interface** is FALSE?

- **A.** A useful way to remember Interface is that it is not the same as “A class you instantiate with new on the interface name when it has no default methods”.
- **B.** A class may implement only one interface.
- **C.** Interface is correctly understood as: a reference type whose abstract instance methods a class can implement (multiple interfaces allowed).
- **D.** In this module, Interface is a core idea students must distinguish from nearby terms.

**Answer:** B
**Explanation:** The false claim is: A class may implement only one interface.. Interface actually means: A reference type whose abstract instance methods a class can implement (multiple interfaces allowed).

### Q38  ·  Intermediate
**Question:** Which statement about **Method overriding** is FALSE?

- **A.** Method overriding is correctly understood as: a subclass instance method with the same signature and compatible return replacing the superclass one.
- **B.** In this module, Method overriding is a core idea students must distinguish from nearby terms.
- **C.** Overriding is chosen entirely at compile time from the reference type, never from the object.
- **D.** A useful way to remember Method overriding is that it is not the same as “A method with a different parameter list in the same class”.

**Answer:** C
**Explanation:** The false claim is: Overriding is chosen entirely at compile time from the reference type, never from the object.. Method overriding actually means: A subclass instance method with the same signature and compatible return replacing the superclass one.

### Q39  ·  Intermediate
**Question:** Which statement about **Object class** is FALSE?

- **A.** A class that writes extends Object is illegal because Object is final.
- **B.** Object class is correctly understood as: the root of the class hierarchy; every class extends Object directly or indirectly.
- **C.** A useful way to remember Object class is that it is not the same as “A class only strings extend”.
- **D.** In this module, Object class is a core idea students must distinguish from nearby terms.

**Answer:** A
**Explanation:** The false claim is: A class that writes extends Object is illegal because Object is final.. Object class actually means: The root of the class hierarchy; every class extends Object directly or indirectly.

### Q40  ·  Intermediate
**Question:** Which statement about **Package** is FALSE?

- **A.** Two classes with the same simple name in one package are allowed if they differ in case only on a case-insensitive OS without issue.
- **B.** Package is correctly understood as: a namespace grouping related types, typically mapped to a directory, declared with package.
- **C.** In this module, Package is a core idea students must distinguish from nearby terms.
- **D.** A useful way to remember Package is that it is not the same as “A JAR file’s only mandatory name”.

**Answer:** A
**Explanation:** The false claim is: Two classes with the same simple name in one package are allowed if they differ in case only on a case-insensitive OS without issue.. Package actually means: A namespace grouping related types, typically mapped to a directory, declared with package.

### Q41  ·  Intermediate
**Question:** Which statement about **abstract class** is FALSE?

- **A.** abstract class is correctly understood as: a class that may contain abstract methods and cannot be instantiated with new.
- **B.** You can write new AbstractShape() if the class has no abstract methods even when the class is declared abstract.
- **C.** In this module, abstract class is a core idea students must distinguish from nearby terms.
- **D.** A useful way to remember abstract class is that it is not the same as “A class that must have only private constructors”.

**Answer:** B
**Explanation:** The false claim is: You can write new AbstractShape() if the class has no abstract methods even when the class is declared abstract.. abstract class actually means: A class that may contain abstract methods and cannot be instantiated with new.

### Q42  ·  Intermediate
**Question:** Which statement about **default method** is FALSE?

- **A.** Default methods existed in Java 1.0 interfaces as public concrete methods.
- **B.** A useful way to remember default method is that it is not the same as “A package-private class method”.
- **C.** default method is correctly understood as: an interface method with a body, inherited by implementors unless overridden (Java 8+).
- **D.** In this module, default method is a core idea students must distinguish from nearby terms.

**Answer:** A
**Explanation:** The false claim is: Default methods existed in Java 1.0 interfaces as public concrete methods.. default method actually means: An interface method with a body, inherited by implementors unless overridden (Java 8+).

### Q43  ·  Intermediate
**Question:** Which statement about **equals / hashCode** is FALSE?

- **A.** In this module, equals / hashCode is a core idea students must distinguish from nearby terms.
- **B.** Overriding equals without hashCode is always safe for HashMap keys.
- **C.** A useful way to remember equals / hashCode is that it is not the same as “Methods that compare class names only”.
- **D.** equals / hashCode is correctly understood as: object identity-based by default; contracts require overriding both if value equality is needed.

**Answer:** B
**Explanation:** The false claim is: Overriding equals without hashCode is always safe for HashMap keys.. equals / hashCode actually means: Object identity-based by default; contracts require overriding both if value equality is needed.

### Q44  ·  Intermediate
**Question:** Which statement about **extends** is FALSE?

- **A.** extends is correctly understood as: a class inherits fields and methods of one superclass (single class inheritance).
- **B.** A useful way to remember extends is that it is not the same as “A class inheriting two concrete superclasses”.
- **C.** A Java class may extend two classes in one extends clause.
- **D.** In this module, extends is a core idea students must distinguish from nearby terms.

**Answer:** C
**Explanation:** The false claim is: A Java class may extend two classes in one extends clause.. extends actually means: A class inherits fields and methods of one superclass (single class inheritance).

### Q45  ·  Intermediate
**Question:** You override equals based on id but forget hashCode. Putting objects in HashSet may:

- **A.** Only affect ArrayList
- **B.** Be always fine
- **C.** Break the hashCode/equals contract so equal objects can both appear or fail lookup
- **D.** Disable GC

**Answer:** C
**Explanation:** Equal objects must share hashCode for hash collections.

### Q46  ·  Difficult
**Question:** Circle implements Drawable, Measurable. This shows:

- **A.** A package cycle
- **B.** An abstract class with two supers
- **C.** A class may implement multiple interfaces
- **D.** Multiple class inheritance

**Answer:** C
**Explanation:** implements I1, I2 is legal.

### Q47  ·  Difficult
**Question:** How many bits in a Java long, used often as an Object.hashCode mixer input width vs int hashCode?

- **A.** 32
- **B.** 16
- **C.** 8
- **D.** 64

**Answer:** D
**Explanation:** long is 64 bits; Object.hashCode returns int (32 bits).

### Q48  ·  Difficult
**Question:** How many direct superclasses may a Java class have?

- **A.** 0 always
- **B.** Unlimited classes
- **C.** 1 (besides the implicit Object root chain)
- **D.** 2

**Answer:** C
**Explanation:** Single class inheritance: at most one extends.

### Q49  ·  Difficult
**Question:** If two interfaces supply the same default method signature, a class implementing both must:

- **A.** Pick one with an override (possibly Interface.super.m()) or fail to compile
- **B.** Use the first interface listed
- **C.** Ignore both
- **D.** Use Object’s version

**Answer:** A
**Explanation:** Default conflict requires an explicit override.

### Q50  ·  Difficult
**Question:** Object o = "Java"; (o instanceof String) is:

- **A.** true
- **B.** null
- **C.** false
- **D.** compile error

**Answer:** A
**Explanation:** The runtime object is a String.

### Q51  ·  Difficult
**Question:** Parent has a private method m(); Child declares m(). A Parent ref to a Child calling m():

- **A.** Parent’s m is not overridden; private methods are invoked with static binding in the parent
- **B.** Compile error at the call if invoked on Parent ref from outside
- **C.** It is a default method
- **D.** Child.m always runs

**Answer:** A
**Explanation:** private methods are not virtual. Visibility of the call depends on where the call site is; from Parent code, Parent.m runs.

### Q52  ·  Difficult
**Question:** What is the most important distinction between **Object.equals** and **== on references**?

- **A.** They coincide for all Integer values including 128.
- **B.** == on String is the reliable content test.
- **C.** equals cannot be overridden.
- **D.** equals can be value equality if overridden; == is always identity for references.

**Answer:** D
**Explanation:** equals can be value equality if overridden; == is always identity for references.

### Q53  ·  Difficult
**Question:** What is the most important distinction between **overriding** and **hiding (static)**?

- **A.** @Override is legal on a static hide.
- **B.** Static methods override at runtime.
- **C.** Instance methods override and dispatch virtually; static methods hide and bind to the reference type.
- **D.** Instance methods bind only to the variable type.

**Answer:** C
**Explanation:** Instance methods override and dispatch virtually; static methods hide and bind to the reference type.

### Q54  ·  Difficult
**Question:** What is the most important distinction between **package** and **JAR**?

- **A.** They are the same word.
- **B.** A package is a ZIP file.
- **C.** A JAR is a JVM instruction.
- **D.** A package is a namespace/directory of types; a JAR is a ZIP of class files (and resources) that may contain many packages.

**Answer:** D
**Explanation:** A package is a namespace/directory of types; a JAR is a ZIP of class files (and resources) that may contain many packages.

### Q55  ·  Difficult
**Question:** What is the most important distinction between **protected** and **default access**?

- **A.** protected is class-private.
- **B.** Default is visible to all subclasses worldwide.
- **C.** protected is visible to subclasses outside the package; default is not.
- **D.** They are the same in other packages.

**Answer:** C
**Explanation:** protected is visible to subclasses outside the package; default is not.

### Q56  ·  Difficult
**Question:** Which statement about **Dynamic dispatch** is FALSE?

- **A.** private, static and constructors are dynamically dispatched based on the object’s type.
- **B.** A useful way to remember Dynamic dispatch is that it is not the same as “The compiler always binds instance methods using only the variable’s declared type”.
- **C.** Dynamic dispatch is correctly understood as: the JVM selects the overridden instance method using the runtime type of the object.
- **D.** In this module, Dynamic dispatch is a core idea students must distinguish from nearby terms.

**Answer:** A
**Explanation:** The false claim is: private, static and constructors are dynamically dispatched based on the object’s type.. Dynamic dispatch actually means: The JVM selects the overridden instance method using the runtime type of the object.

### Q57  ·  Difficult
**Question:** Which statement about **abstract method** is FALSE?

- **A.** An abstract method may be declared in a concrete (non-abstract) class.
- **B.** abstract method is correctly understood as: a method without a body that subclasses (or further abstracts) must implement.
- **C.** A useful way to remember abstract method is that it is not the same as “A method marked final”.
- **D.** In this module, abstract method is a core idea students must distinguish from nearby terms.

**Answer:** A
**Explanation:** The false claim is: An abstract method may be declared in a concrete (non-abstract) class.. abstract method actually means: A method without a body that subclasses (or further abstracts) must implement.

### Q58  ·  Difficult
**Question:** Which statement about **final class** is FALSE?

- **A.** In this module, final class is a core idea students must distinguish from nearby terms.
- **B.** A useful way to remember final class is that it is not the same as “A class that cannot be instantiated”.
- **C.** final classes are the only classes that can be extended by two children.
- **D.** final class is correctly understood as: a class that cannot be subclassed.

**Answer:** C
**Explanation:** The false claim is: final classes are the only classes that can be extended by two children.. final class actually means: A class that cannot be subclassed.

### Q59  ·  Difficult
**Question:** Which statement about **implements** is FALSE?

- **A.** In this module, implements is a core idea students must distinguish from nearby terms.
- **B.** implements is used to inherit a concrete class.
- **C.** implements is correctly understood as: the clause listing interfaces whose contracts a class agrees to fulfil.
- **D.** A useful way to remember implements is that it is not the same as “The keyword to extend a class”.

**Answer:** B
**Explanation:** The false claim is: implements is used to inherit a concrete class.. implements actually means: The clause listing interfaces whose contracts a class agrees to fulfil.

### Q60  ·  Difficult
**Question:** Which statement about **import** is FALSE?

- **A.** import java.util.* copies ArrayList source into your file.
- **B.** In this module, import is a core idea students must distinguish from nearby terms.
- **C.** A useful way to remember import is that it is not the same as “A runtime copy of another class’s bytecode into yours”.
- **D.** import is correctly understood as: a compile-time convenience to name types without the full package prefix.

**Answer:** A
**Explanation:** The false claim is: import java.util.* copies ArrayList source into your file.. import actually means: A compile-time convenience to name types without the full package prefix.

### Q61  ·  Difficult
**Question:** Which statement about **protected** is FALSE?

- **A.** A useful way to remember protected is that it is not the same as “Visible only in the same class”.
- **B.** In this module, protected is a core idea students must distinguish from nearby terms.
- **C.** protected is less visible than default package access.
- **D.** protected is correctly understood as: visible in the same package and to subclasses (with extra rules for instance access across packages).

**Answer:** C
**Explanation:** The false claim is: protected is less visible than default package access.. protected actually means: Visible in the same package and to subclasses (with extra rules for instance access across packages).

### Q62  ·  Difficult
**Question:** Which statement about **static interface method** is FALSE?

- **A.** Implementing classes inherit static interface methods as instance methods.
- **B.** A useful way to remember static interface method is that it is not the same as “A method called on this inside the implementing class automatically”.
- **C.** In this module, static interface method is a core idea students must distinguish from nearby terms.
- **D.** static interface method is correctly understood as: a helper invoked as InterfaceName.method, not inherited as an instance method on implementors.

**Answer:** A
**Explanation:** The false claim is: Implementing classes inherit static interface methods as instance methods.. static interface method actually means: A helper invoked as InterfaceName.method, not inherited as an instance method on implementors.

### Q63  ·  Difficult
**Question:** Which statement about **super** is FALSE?

- **A.** In this module, super is a core idea students must distinguish from nearby terms.
- **B.** super is correctly understood as: a reference used to call a superclass constructor or hidden/overridden members.
- **C.** super() may appear after other statements in a constructor.
- **D.** A useful way to remember super is that it is not the same as “A synonym for this in static methods”.

**Answer:** C
**Explanation:** The false claim is: super() may appear after other statements in a constructor.. super actually means: A reference used to call a superclass constructor or hidden/overridden members.

### Q64  ·  Difficult
**Question:** Which statement about **toString** is FALSE?

- **A.** toString is final and cannot be overridden.
- **B.** toString is correctly understood as: an Object method returning a string view; override it for readable objects.
- **C.** In this module, toString is a core idea students must distinguish from nearby terms.
- **D.** A useful way to remember toString is that it is not the same as “A static method of System”.

**Answer:** A
**Explanation:** The false claim is: toString is final and cannot be overridden.. toString actually means: An Object method returning a string view; override it for readable objects.

### Q65  ·  Difficult
**Question:** Why must super() or this() be the first statement of a constructor?

- **A.** Because this is static
- **B.** To skip Object
- **C.** The superclass (or alternate constructor) must initialise the object before the subclass body uses it
- **D.** The JVM forbids methods in constructors

**Answer:** C
**Explanation:** Language rule keeps initialisation order safe.

### Q66  ·  Difficult
**Question:** You need many unrelated classes to provide pay() and also share a taxRate constant. A clean Java SE approach is:

- **A.** Making pay a static method on Object
- **B.** Copy-paste pay into each class without a type
- **C.** An interface with pay() and a public static final taxRate (or static method)
- **D.** Multiple class inheritance

**Answer:** C
**Explanation:** Interfaces give multiple type inheritance and constants.

### Q67  ·  Difficult
**Question:** class A { A(){ System.out.print("A"); } } class B extends A { B(){ System.out.print("B"); } } new B() prints:

- **A.** A
- **B.** AB
- **C.** B
- **D.** BA

**Answer:** B
**Explanation:** Implicit super() runs A’s constructor first, then B.

### Q68  ·  Difficult
**Question:** class A { int f(){ return 1; } } class B extends A { int f(){ return 2; } } A x = new B(); x.f() returns:

- **A.** compile error
- **B.** 1
- **C.** 0
- **D.** 2

**Answer:** D
**Explanation:** Instance method f is overridden; runtime type B yields 2.

### Q69  ·  Difficult
**Question:** class A { static int f(){ return 1; } } class B extends A { static int f(){ return 2; } } A x = new B(); A.f() via x.f() returns:

- **A.** runtime error
- **B.** 1
- **C.** 2
- **D.** 3

**Answer:** B
**Explanation:** Static methods are hidden, not overridden; the compiler uses the reference type A ⇒ 1.

### Q70  ·  Difficult
**Question:** interface I { default int n(){ return 3; } } class C implements I {} new C().n() returns:

- **A.** 4
- **B.** 3
- **C.** 0
- **D.** compile error

**Answer:** B
**Explanation:** The default method is inherited.

### Q71  ·  Difficult
**Question:** interface I { static int k(){ return 4; } } class C implements I {} The legal call is:

- **A.** super.k()
- **B.** new C().k() as an inherited instance method (Java 8 teaching rule: static not inherited)
- **C.** C.k() always without importing I
- **D.** I.k()

**Answer:** D
**Explanation:** Call static interface methods on the interface name.

---

## Quick answer key

Q01–B | Q02–A | Q03–C | Q04–D | Q05–B | Q06–A | Q07–B | Q08–D | Q09–C | Q10–A | Q11–C | Q12–A | Q13–A | Q14–B | Q15–A | Q16–C | Q17–D | Q18–B | Q19–D | Q20–A | Q21–B | Q22–B | Q23–C | Q24–A | Q25–B | Q26–A | Q27–B | Q28–A | Q29–D | Q30–B | Q31–A | Q32–C | Q33–D | Q34–C | Q35–C | Q36–D | Q37–B | Q38–C | Q39–A | Q40–A | Q41–B | Q42–A | Q43–B | Q44–C | Q45–C | Q46–C | Q47–D | Q48–C | Q49–A | Q50–A | Q51–A | Q52–D | Q53–C | Q54–D | Q55–C | Q56–A | Q57–A | Q58–C | Q59–B | Q60–A | Q61–C | Q62–A | Q63–C | Q64–A | Q65–C | Q66–C | Q67–B | Q68–D | Q69–B | Q70–B | Q71–D
