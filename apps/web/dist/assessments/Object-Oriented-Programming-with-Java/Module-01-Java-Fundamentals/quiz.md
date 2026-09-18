# Quiz — Object Oriented Programming with Java — Module 1: Java Fundamentals

**Subject:** Object Oriented Programming with Java  
**Module:** Module 1 — Java Fundamentals  
**Questions:** 71  
**Mix:** 11 Easy · 34 Intermediate · 26 Difficult  
**Type:** Multiple choice (single correct option)  
**Instructions:** Choose the best option. Answers and short explanations follow each question.

---

### Q01  ·  Easy
**Question:** Java source files conventionally use the extension:

- **A.** .jvm
- **B.** .java
- **C.** .class
- **D.** .bytecode

**Answer:** B
**Explanation:** Source is .java; compiled output is .class.

### Q02  ·  Easy
**Question:** The default value of an element of new boolean[3] is:

- **A.** null
- **B.** true
- **C.** false
- **D.** 0

**Answer:** C
**Explanation:** boolean array elements default to false.

### Q03  ·  Easy
**Question:** Which option best describes **Abstraction**?

- **A.** Using only public instance variables.
- **B.** Turning off the bytecode verifier.
- **C.** Printing every field of an object in System.out.
- **D.** Exposing essential behaviour while hiding inessential implementation detail.

**Answer:** D
**Explanation:** Abstraction: Exposing essential behaviour while hiding inessential implementation detail.

### Q04  ·  Easy
**Question:** Which option best describes **Encapsulation**?

- **A.** Letting every class field stay public for convenience.
- **B.** Bundling data with methods and hiding representation behind access control.
- **C.** Inheriting two concrete superclasses in one class.
- **D.** Compiling source directly to native machine code.

**Answer:** B
**Explanation:** Encapsulation: Bundling data with methods and hiding representation behind access control.

### Q05  ·  Easy
**Question:** Which option best describes **JDK**?

- **A.** A replacement for the operating system kernel.
- **B.** The JRE plus development tools such as javac, javadoc and jar.
- **C.** The HotSpot JIT without any class library.
- **D.** Only a web browser plugin.

**Answer:** B
**Explanation:** JDK: The JRE plus development tools such as javac, javadoc and jar.

### Q06  ·  Easy
**Question:** Which option best describes **Reference type**?

- **A.** The void keyword used as a local variable type.
- **B.** A CPU register width.
- **C.** A 32-bit two’s-complement integer only.
- **D.** A type whose values are references to objects (or null), including classes, arrays, interfaces and enums.

**Answer:** D
**Explanation:** Reference type: A type whose values are references to objects (or null), including classes, arrays, interfaces and enums.

### Q07  ·  Easy
**Question:** Which option best describes **break**?

- **A.** A keyword that ends the JVM process.
- **B.** A statement that skips only the next iteration and continues the loop.
- **C.** A statement that exits the innermost switch or loop (or a labelled statement).
- **D.** A method that returns from main only.

**Answer:** C
**Explanation:** break: A statement that exits the innermost switch or loop (or a labelled statement).

### Q08  ·  Easy
**Question:** Which option best describes **if statement**?

- **A.** A conditional that executes a branch when its boolean expression is true.
- **B.** A switch that requires String labels only.
- **C.** A jump table that cannot nest.
- **D.** A loop that always runs at least once.

**Answer:** A
**Explanation:** if statement: A conditional that executes a branch when its boolean expression is true.

### Q09  ·  Easy
**Question:** Which sequence correctly describes **from source to running program**?

- **A.** Write .java → javac → .class bytecode → JVM load/verify/JIT or interpret → run
- **B.** JIT produces .java from bytecode first
- **C.** javac runs the program then writes source
- **D.** JVM → write .java → native .exe → javac

**Answer:** A
**Explanation:** Correct sequence for from source to running program: Write .java → javac → .class bytecode → JVM load/verify/JIT or interpret → run

### Q10  ·  Easy
**Question:** Which sequence correctly describes **switch with break**?

- **A.** jump to default first always then the matching case
- **B.** execute every case always, then pick one
- **C.** evaluate selector → match a case (or default) → execute until break → leave switch
- **D.** compile-time unroll into threads

**Answer:** C
**Explanation:** Correct sequence for switch with break: evaluate selector → match a case (or default) → execute until break → leave switch

### Q11  ·  Easy
**Question:** Which tool compiles Java source to bytecode?

- **A.** javac
- **B.** jar only
- **C.** java launcher
- **D.** javadoc

**Answer:** A
**Explanation:** javac emits .class files.

### Q12  ·  Intermediate
**Question:** A lab machine has the JRE but not the JDK. Students can:

- **A.** Run existing bytecode but cannot compile .java files
- **B.** Install classes into the kernel
- **C.** Only edit source with javac
- **D.** Compile .java files but not run them

**Answer:** A
**Explanation:** JRE runs programs; javac lives in the JDK.

### Q13  ·  Intermediate
**Question:** The expression if (x = 5) fails to compile when x is int because:

- **A.** The condition must be boolean; assignment to int is not boolean
- **B.** Assignments are illegal in Java
- **C.** 5 is not a literal
- **D.** if cannot be used in main

**Answer:** A
**Explanation:** Unlike C, Java forbids implicit int-to-boolean.

### Q14  ·  Intermediate
**Question:** What is printed by System.out.println(1 + 2 + "A" + 3 + 4);?

- **A.** 3A34
- **B.** 6A
- **C.** 12A34
- **D.** 3A7

**Answer:** A
**Explanation:** Left-to-right: 1+2=3, then string concat yields 3A then 3A3 then 3A34.

### Q15  ·  Intermediate
**Question:** What is the most important distinction between **JDK** and **JRE**?

- **A.** The JRE is only a text editor.
- **B.** The JRE contains javac; the JDK cannot run bytecode.
- **C.** They are identical ZIP files.
- **D.** The JDK can compile and run programs; the JRE can run them but has no javac.

**Answer:** D
**Explanation:** The JDK can compile and run programs; the JRE can run them but has no javac.

### Q16  ·  Intermediate
**Question:** What is the most important distinction between **break** and **continue**?

- **A.** They are interchangeable labels.
- **B.** break only skips one statement inside the body.
- **C.** continue always exits the method.
- **D.** break leaves the loop/switch; continue starts the next iteration.

**Answer:** D
**Explanation:** break leaves the loop/switch; continue starts the next iteration.

### Q17  ·  Intermediate
**Question:** What is the most important distinction between **if-else** and **switch**?

- **A.** if cannot nest.
- **B.** if-else handles arbitrary booleans; switch matches a selector against case labels.
- **C.** switch forbids String labels in Java 7+.
- **D.** switch can test ranges like if (x > 0 && x < 10) natively in basic SE.

**Answer:** B
**Explanation:** if-else handles arbitrary booleans; switch matches a selector against case labels.

### Q18  ·  Intermediate
**Question:** What is the most important distinction between **primitive** and **reference type**?

- **A.** Primitives hold values; references point to objects (or null) on the heap.
- **B.** Primitives can be null.
- **C.** References cannot be passed to methods.
- **D.** int is a subclass of Object.

**Answer:** A
**Explanation:** Primitives hold values; references point to objects (or null) on the heap.

### Q19  ·  Intermediate
**Question:** Which is a valid Java identifier?

- **A.** 2marks
- **B.** marks_2
- **C.** class
- **D.** null

**Answer:** B
**Explanation:** Cannot start with a digit; class and null are keywords/literals.

### Q20  ·  Intermediate
**Question:** Which loop header is an infinite loop?

- **A.** while (false)
- **B.** for (;;)
- **C.** do { } while (false);
- **D.** for (int i = 0; i < 10; i++)

**Answer:** B
**Explanation:** for(;;) has no test, equivalent to while(true).

### Q21  ·  Intermediate
**Question:** Which option best describes **Array**?

- **A.** A map from String keys to values.
- **B.** A resizable List that grows with add().
- **C.** A fixed-length object holding components of one type, indexed from 0.
- **D.** A method that returns multiple primitives by stacking them.

**Answer:** C
**Explanation:** Array: A fixed-length object holding components of one type, indexed from 0.

### Q22  ·  Intermediate
**Question:** Which option best describes **Bytecode**?

- **A.** Platform-neutral instructions in a .class file that the JVM interprets or JITs.
- **B.** Native x86 opcodes written by hand in a .exe.
- **C.** UTF-16 source comments stored in .java files.
- **D.** SQL stored procedures inside Oracle.

**Answer:** A
**Explanation:** Bytecode: Platform-neutral instructions in a .class file that the JVM interprets or JITs.

### Q23  ·  Intermediate
**Question:** Which option best describes **Inheritance**?

- **A.** A method throwing a checked exception.
- **B.** The JVM verifying bytecode checksums.
- **C.** Two classes sharing only a static import.
- **D.** A class reusing and extending the members of a superclass.

**Answer:** D
**Explanation:** Inheritance: A class reusing and extending the members of a superclass.

### Q24  ·  Intermediate
**Question:** Which option best describes **JRE**?

- **A.** A debugger GUI that cannot execute code.
- **B.** The JVM plus core class libraries needed to run Java programs.
- **C.** The native C++ linker.
- **D.** Only the javac compiler with no runtime.

**Answer:** B
**Explanation:** JRE: The JVM plus core class libraries needed to run Java programs.

### Q25  ·  Intermediate
**Question:** Which option best describes **JVM**?

- **A.** The runtime that loads bytecode and executes it on the host platform.
- **B.** The HTTP server inside every JAR.
- **C.** The javac compiler that produces .java text files.
- **D.** A text editor bundled with the JDK.

**Answer:** A
**Explanation:** JVM: The runtime that loads bytecode and executes it on the host platform.

### Q26  ·  Intermediate
**Question:** Which option best describes **Operator precedence**?

- **A.** Left-to-right evaluation of all operators ignoring * vs +.
- **B.** The rule that decides which operator in an expression binds first, e.g. * before +.
- **C.** The order methods are JIT-compiled.
- **D.** A rule that unary operators always bind last.

**Answer:** B
**Explanation:** Operator precedence: The rule that decides which operator in an expression binds first, e.g. * before +.

### Q27  ·  Intermediate
**Question:** Which option best describes **Polymorphism**?

- **A.** The same message selecting different implementations at compile time or run time.
- **B.** Deleting bytecode after one run.
- **C.** Forbidding method override in every subclass.
- **D.** Storing all objects in a single primitive array of int.

**Answer:** A
**Explanation:** Polymorphism: The same message selecting different implementations at compile time or run time.

### Q28  ·  Intermediate
**Question:** Which option best describes **Primitive type**?

- **A.** A user-defined enum only.
- **B.** A built-in non-object type such as int, boolean or double.
- **C.** Any class that extends Object.
- **D.** A type that must be allocated with new.

**Answer:** B
**Explanation:** Primitive type: A built-in non-object type such as int, boolean or double.

### Q29  ·  Intermediate
**Question:** Which option best describes **Unicode char**?

- **A.** A 32-bit Unicode scalar always.
- **B.** A signed 16-bit two’s-complement type like short.
- **C.** An 8-bit ASCII-only type.
- **D.** Java’s char is a 16-bit unsigned UTF-16 code unit.

**Answer:** D
**Explanation:** Unicode char: Java’s char is a 16-bit unsigned UTF-16 code unit.

### Q30  ·  Intermediate
**Question:** Which option best describes **continue**?

- **A.** A statement that skips the rest of the current loop iteration and proceeds to the next.
- **B.** A statement that leaves the loop permanently.
- **C.** A keyword that resumes a paused thread.
- **D.** A compiler directive to ignore errors.

**Answer:** A
**Explanation:** continue: A statement that skips the rest of the current loop iteration and proceeds to the next.

### Q31  ·  Intermediate
**Question:** Which option best describes **for loop**?

- **A.** An exception handler.
- **B.** A loop with init, boolean condition and update executed around a body.
- **C.** A switch with fall-through disabled by default.
- **D.** A method that runs exactly once then returns.

**Answer:** B
**Explanation:** for loop: A loop with init, boolean condition and update executed around a body.

### Q32  ·  Intermediate
**Question:** Which option best describes **switch**?

- **A.** A loop that increments a counter automatically.
- **B.** A replacement for try/catch.
- **C.** A multi-way branch on a selector of allowed types such as int, String or enum.
- **D.** A statement that can switch on a boolean primitive in classic Java SE 8 teaching subset.

**Answer:** C
**Explanation:** switch: A multi-way branch on a selector of allowed types such as int, String or enum.

### Q33  ·  Intermediate
**Question:** Which sequence correctly describes **array creation and use**?

- **A.** indexes from 1 to n inclusive by language rule
- **B.** new then change length with a.length = n+1
- **C.** declare type[] → new Type[n] (or initializer) → index 0..n-1 → length field
- **D.** store mixed primitives and objects in one int[]

**Answer:** C
**Explanation:** Correct sequence for array creation and use: declare type[] → new Type[n] (or initializer) → index 0..n-1 → length field

### Q34  ·  Intermediate
**Question:** Which sequence correctly describes **typical for-loop control**?

- **A.** update → body → init
- **B.** body → init → update forever without a test
- **C.** init once → test condition → body → update → test again until false
- **D.** test only after the JVM exits

**Answer:** C
**Explanation:** Correct sequence for typical for-loop control: init once → test condition → body → update → test again until false

### Q35  ·  Intermediate
**Question:** Which statement about **Array** is FALSE?

- **A.** A useful way to remember Array is that it is not the same as “A resizable List that grows with add()”.
- **B.** Java arrays change length automatically when you assign past the last index.
- **C.** Array is correctly understood as: a fixed-length object holding components of one type, indexed from 0.
- **D.** In this module, Array is a core idea students must distinguish from nearby terms.

**Answer:** B
**Explanation:** The false claim is: Java arrays change length automatically when you assign past the last index.. Array actually means: A fixed-length object holding components of one type, indexed from 0.

### Q36  ·  Intermediate
**Question:** Which statement about **Encapsulation** is FALSE?

- **A.** Encapsulation is correctly understood as: bundling data with methods and hiding representation behind access control.
- **B.** A useful way to remember Encapsulation is that it is not the same as “Letting every class field stay public for convenience”.
- **C.** Encapsulation means making every field public so other classes can edit it freely.
- **D.** In this module, Encapsulation is a core idea students must distinguish from nearby terms.

**Answer:** C
**Explanation:** The false claim is: Encapsulation means making every field public so other classes can edit it freely.. Encapsulation actually means: Bundling data with methods and hiding representation behind access control.

### Q37  ·  Intermediate
**Question:** Which statement about **JDK** is FALSE?

- **A.** The JDK cannot compile source because it lacks javac.
- **B.** JDK is correctly understood as: the JRE plus development tools such as javac, javadoc and jar.
- **C.** In this module, JDK is a core idea students must distinguish from nearby terms.
- **D.** A useful way to remember JDK is that it is not the same as “Only a web browser plugin”.

**Answer:** A
**Explanation:** The false claim is: The JDK cannot compile source because it lacks javac.. JDK actually means: The JRE plus development tools such as javac, javadoc and jar.

### Q38  ·  Intermediate
**Question:** Which statement about **JVM** is FALSE?

- **A.** JVM is correctly understood as: the runtime that loads bytecode and executes it on the host platform.
- **B.** The JVM compiles .java source; javac executes the program.
- **C.** In this module, JVM is a core idea students must distinguish from nearby terms.
- **D.** A useful way to remember JVM is that it is not the same as “The javac compiler that produces .java text files”.

**Answer:** B
**Explanation:** The false claim is: The JVM compiles .java source; javac executes the program.. JVM actually means: The runtime that loads bytecode and executes it on the host platform.

### Q39  ·  Intermediate
**Question:** Which statement about **Polymorphism** is FALSE?

- **A.** Polymorphism is correctly understood as: the same message selecting different implementations at compile time or run time.
- **B.** In this module, Polymorphism is a core idea students must distinguish from nearby terms.
- **C.** Polymorphism requires that every method be static and final.
- **D.** A useful way to remember Polymorphism is that it is not the same as “Storing all objects in a single primitive array of int”.

**Answer:** C
**Explanation:** The false claim is: Polymorphism requires that every method be static and final.. Polymorphism actually means: The same message selecting different implementations at compile time or run time.

### Q40  ·  Intermediate
**Question:** Which statement about **Primitive type** is FALSE?

- **A.** A useful way to remember Primitive type is that it is not the same as “Any class that extends Object”.
- **B.** Primitive type is correctly understood as: a built-in non-object type such as int, boolean or double.
- **C.** In this module, Primitive type is a core idea students must distinguish from nearby terms.
- **D.** int is a subclass of Object and can be used as a type argument without wrapping.

**Answer:** D
**Explanation:** The false claim is: int is a subclass of Object and can be used as a type argument without wrapping.. Primitive type actually means: A built-in non-object type such as int, boolean or double.

### Q41  ·  Intermediate
**Question:** Which statement about **continue** is FALSE?

- **A.** In this module, continue is a core idea students must distinguish from nearby terms.
- **B.** continue exits the loop the same way break does.
- **C.** A useful way to remember continue is that it is not the same as “A statement that leaves the loop permanently”.
- **D.** continue is correctly understood as: a statement that skips the rest of the current loop iteration and proceeds to the next.

**Answer:** B
**Explanation:** The false claim is: continue exits the loop the same way break does.. continue actually means: A statement that skips the rest of the current loop iteration and proceeds to the next.

### Q42  ·  Intermediate
**Question:** Which statement about **for loop** is FALSE?

- **A.** A for loop’s condition may be omitted and still terminate after one iteration by language rule.
- **B.** for loop is correctly understood as: a loop with init, boolean condition and update executed around a body.
- **C.** A useful way to remember for loop is that it is not the same as “A method that runs exactly once then returns”.
- **D.** In this module, for loop is a core idea students must distinguish from nearby terms.

**Answer:** A
**Explanation:** The false claim is: A for loop’s condition may be omitted and still terminate after one iteration by language rule.. for loop actually means: A loop with init, boolean condition and update executed around a body.

### Q43  ·  Intermediate
**Question:** Which statement about **if statement** is FALSE?

- **A.** An if condition may be the integer 1 meaning true, as in C.
- **B.** A useful way to remember if statement is that it is not the same as “A loop that always runs at least once”.
- **C.** if statement is correctly understood as: a conditional that executes a branch when its boolean expression is true.
- **D.** In this module, if statement is a core idea students must distinguish from nearby terms.

**Answer:** A
**Explanation:** The false claim is: An if condition may be the integer 1 meaning true, as in C.. if statement actually means: A conditional that executes a branch when its boolean expression is true.

### Q44  ·  Intermediate
**Question:** You write byte b = 50; byte c = b + 10; and it fails to compile. Why?

- **A.** 10 is a long
- **B.** byte cannot hold 60
- **C.** b + 10 is promoted to int; assigning int to byte needs a cast
- **D.** Arithmetic on byte is illegal

**Answer:** C
**Explanation:** Binary numeric promotion lifts byte to int.

### Q45  ·  Intermediate
**Question:** for (int i = 0; i < 3; i++) { if (i == 1) continue; System.out.print(i); } prints:

- **A.** 01
- **B.** 012
- **C.** 02
- **D.** 0

**Answer:** C
**Explanation:** When i==1, continue skips printing; 0 and 2 print.

### Q46  ·  Difficult
**Question:** A .java file compiles to bytecode that later runs on Linux and Windows without recompilation. This is mainly because of:

- **A.** The C preprocessor
- **B.** BIOS firmware interpreting Java
- **C.** JVM + platform-neutral bytecode
- **D.** Static linking of a Windows .exe on Linux

**Answer:** C
**Explanation:** Write once, run anywhere is bytecode on a JVM.

### Q47  ·  Difficult
**Question:** A switch on an int has case 1 without break, then case 2. When the selector is 1:

- **A.** Execution falls through into case 2 unless a break (or similar) stops it
- **B.** The compiler rejects missing break
- **C.** Both cases run on separate threads
- **D.** Only case 1 runs; fall-through is impossible

**Answer:** A
**Explanation:** Classic switch fall-through continues until break/return.

### Q48  ·  Difficult
**Question:** How many bits does the primitive type char occupy in Java?

- **A.** 64
- **B.** 16
- **C.** 8
- **D.** 32

**Answer:** B
**Explanation:** char is an unsigned 16-bit UTF-16 code unit.

### Q49  ·  Difficult
**Question:** What is the most important distinction between **== on primitives** and **== on references**?

- **A.** They are the same for Integer cache-unrelated values.
- **B.** == on String always compares character content.
- **C.** == on int compares object identity.
- **D.** == compares primitive values but reference identity, not object state.

**Answer:** D
**Explanation:** == compares primitive values but reference identity, not object state.

### Q50  ·  Difficult
**Question:** What is the most important distinction between **JVM** and **bytecode**?

- **A.** The JVM is stored inside every String.
- **B.** Bytecode is the JVM process itself.
- **C.** The JVM is the engine; bytecode is the instruction stream it executes.
- **D.** They are both .java source.

**Answer:** C
**Explanation:** The JVM is the engine; bytecode is the instruction stream it executes.

### Q51  ·  Difficult
**Question:** What is the most important distinction between **length of array** and **length() of String**?

- **A.** String.length is a field like arrays.
- **B.** Both are methods named length().
- **C.** Both are public fields named length.
- **D.** Array length is a field; String length() is a method.

**Answer:** D
**Explanation:** Array length is a field; String length() is a method.

### Q52  ·  Difficult
**Question:** What is the most important distinction between **while** and **do-while**?

- **A.** while always runs once.
- **B.** do-while never tests a condition.
- **C.** while tests before the body; do-while always runs the body once then tests.
- **D.** They generate identical bytecode always.

**Answer:** C
**Explanation:** while tests before the body; do-while always runs the body once then tests.

### Q53  ·  Difficult
**Question:** What is the value of 2 << 3 in Java?

- **A.** 8
- **B.** 16
- **C.** 6
- **D.** 5

**Answer:** B
**Explanation:** Left shift by 3 multiplies by 8: 2×8=16.

### Q54  ·  Difficult
**Question:** What is the value of the Java expression 5 + 3 * 2?

- **A.** 13
- **B.** 16
- **C.** 10
- **D.** 11

**Answer:** D
**Explanation:** * binds before + so 5 + 6 = 11.

### Q55  ·  Difficult
**Question:** Which loop is guaranteed to execute its body at least once?

- **A.** An empty infinite for(;;) that you never enter
- **B.** while with a false condition
- **C.** for with a false condition
- **D.** do-while

**Answer:** D
**Explanation:** do-while tests after the body.

### Q56  ·  Difficult
**Question:** Which statement about **Abstraction** is FALSE?

- **A.** Abstraction is achieved only by making every class a concrete class with public fields.
- **B.** A useful way to remember Abstraction is that it is not the same as “Printing every field of an object in System.out”.
- **C.** Abstraction is correctly understood as: exposing essential behaviour while hiding inessential implementation detail.
- **D.** In this module, Abstraction is a core idea students must distinguish from nearby terms.

**Answer:** A
**Explanation:** The false claim is: Abstraction is achieved only by making every class a concrete class with public fields.. Abstraction actually means: Exposing essential behaviour while hiding inessential implementation detail.

### Q57  ·  Difficult
**Question:** Which statement about **Bytecode** is FALSE?

- **A.** Bytecode is Intel machine code and will not run on ARM JVMs.
- **B.** In this module, Bytecode is a core idea students must distinguish from nearby terms.
- **C.** A useful way to remember Bytecode is that it is not the same as “Native x86 opcodes written by hand in a .exe”.
- **D.** Bytecode is correctly understood as: platform-neutral instructions in a .class file that the JVM interprets or JITs.

**Answer:** A
**Explanation:** The false claim is: Bytecode is Intel machine code and will not run on ARM JVMs.. Bytecode actually means: Platform-neutral instructions in a .class file that the JVM interprets or JITs.

### Q58  ·  Difficult
**Question:** Which statement about **Inheritance** is FALSE?

- **A.** In this module, Inheritance is a core idea students must distinguish from nearby terms.
- **B.** Inheritance is correctly understood as: a class reusing and extending the members of a superclass.
- **C.** Inheritance in Java allows a class to extend two concrete classes at once.
- **D.** A useful way to remember Inheritance is that it is not the same as “Two classes sharing only a static import”.

**Answer:** C
**Explanation:** The false claim is: Inheritance in Java allows a class to extend two concrete classes at once.. Inheritance actually means: A class reusing and extending the members of a superclass.

### Q59  ·  Difficult
**Question:** Which statement about **JRE** is FALSE?

- **A.** The JRE includes javac and is sufficient to compile programs but cannot run them.
- **B.** JRE is correctly understood as: the JVM plus core class libraries needed to run Java programs.
- **C.** A useful way to remember JRE is that it is not the same as “Only the javac compiler with no runtime”.
- **D.** In this module, JRE is a core idea students must distinguish from nearby terms.

**Answer:** A
**Explanation:** The false claim is: The JRE includes javac and is sufficient to compile programs but cannot run them.. JRE actually means: The JVM plus core class libraries needed to run Java programs.

### Q60  ·  Difficult
**Question:** Which statement about **Operator precedence** is FALSE?

- **A.** In this module, Operator precedence is a core idea students must distinguish from nearby terms.
- **B.** In Java, + always binds more tightly than * so 2+3*4 is 20.
- **C.** Operator precedence is correctly understood as: the rule that decides which operator in an expression binds first, e.g. * before +.
- **D.** A useful way to remember Operator precedence is that it is not the same as “Left-to-right evaluation of all operators ignoring * vs +”.

**Answer:** B
**Explanation:** The false claim is: In Java, + always binds more tightly than * so 2+3*4 is 20.. Operator precedence actually means: The rule that decides which operator in an expression binds first, e.g. * before +.

### Q61  ·  Difficult
**Question:** Which statement about **Reference type** is FALSE?

- **A.** A useful way to remember Reference type is that it is not the same as “A 32-bit two’s-complement integer only”.
- **B.** In this module, Reference type is a core idea students must distinguish from nearby terms.
- **C.** Reference types cannot be null and are copied by cloning the whole object graph on every assignment.
- **D.** Reference type is correctly understood as: a type whose values are references to objects (or null), including classes, arrays, interfaces and enums.

**Answer:** C
**Explanation:** The false claim is: Reference types cannot be null and are copied by cloning the whole object graph on every assignment.. Reference type actually means: A type whose values are references to objects (or null), including classes, arrays, interfaces and enums.

### Q62  ·  Difficult
**Question:** Which statement about **Unicode char** is FALSE?

- **A.** In this module, Unicode char is a core idea students must distinguish from nearby terms.
- **B.** A useful way to remember Unicode char is that it is not the same as “An 8-bit ASCII-only type”.
- **C.** A Java char is 8 bits and cannot store ‘₹’ or many non-ASCII letters.
- **D.** Unicode char is correctly understood as: java’s char is a 16-bit unsigned UTF-16 code unit.

**Answer:** C
**Explanation:** The false claim is: A Java char is 8 bits and cannot store ‘₹’ or many non-ASCII letters.. Unicode char actually means: Java’s char is a 16-bit unsigned UTF-16 code unit.

### Q63  ·  Difficult
**Question:** Which statement about **break** is FALSE?

- **A.** break always terminates the whole program, not just the enclosing loop or switch.
- **B.** break is correctly understood as: a statement that exits the innermost switch or loop (or a labelled statement).
- **C.** In this module, break is a core idea students must distinguish from nearby terms.
- **D.** A useful way to remember break is that it is not the same as “A statement that skips only the next iteration and continues the loop”.

**Answer:** A
**Explanation:** The false claim is: break always terminates the whole program, not just the enclosing loop or switch.. break actually means: A statement that exits the innermost switch or loop (or a labelled statement).

### Q64  ·  Difficult
**Question:** Which statement about **switch** is FALSE?

- **A.** A classic Java switch may use a double selector such as 3.14.
- **B.** A useful way to remember switch is that it is not the same as “A loop that increments a counter automatically”.
- **C.** In this module, switch is a core idea students must distinguish from nearby terms.
- **D.** switch is correctly understood as: a multi-way branch on a selector of allowed types such as int, String or enum.

**Answer:** A
**Explanation:** The false claim is: A classic Java switch may use a double selector such as 3.14.. switch actually means: A multi-way branch on a selector of allowed types such as int, String or enum.

### Q65  ·  Difficult
**Question:** You need a 5-element collection of exam marks as primitives with a fixed size known at creation. Best construct?

- **A.** A String of five digits
- **B.** A HashMap with no keys
- **C.** int[] marks = new int[5];
- **D.** ArrayList that stores int primitives directly without wrapping (pre-generic myth)

**Answer:** C
**Explanation:** A primitive array is fixed-length and stores int values.

### Q66  ·  Difficult
**Question:** byte b = (byte)(127 + 1); The value stored in b is:

- **A.** -128
- **B.** 128
- **C.** 127
- **D.** 0

**Answer:** A
**Explanation:** 127+1=128 as int; narrow to byte wraps to -128 (two’s complement 8-bit).

### Q67  ·  Difficult
**Question:** int a = 7, b = 3; what is a % b * 2 + 1?

- **A.** 5
- **B.** 2
- **C.** 1
- **D.** 3

**Answer:** D
**Explanation:** % and * have same precedence and associate left: (7%3)*2+1 = 1*2+1 = 3.

### Q68  ·  Difficult
**Question:** int x = 10; what is printed by System.out.println(10 / 4);?

- **A.** 2.0
- **B.** 2
- **C.** 2.5
- **D.** 3

**Answer:** B
**Explanation:** Both operands are int, so integer division truncates toward 0: 2.

### Q69  ·  Difficult
**Question:** int x = 3; what does System.out.println(x++ * ++x); print?

- **A.** 16
- **B.** 9
- **C.** 15
- **D.** 12

**Answer:** C
**Explanation:** x++ yields 3 then x becomes 4; ++x then makes x=5 and yields 5; 3*5=15.

### Q70  ·  Difficult
**Question:** int x = 5; what does System.out.println(x++ + ++x); print?

- **A.** 10
- **B.** 13
- **C.** 12
- **D.** 11

**Answer:** C
**Explanation:** x++ yields 5 then x becomes 6; ++x then makes x=7 and yields 7; 5+7=12.

### Q71  ·  Difficult
**Question:** int[] a = new int[4]; what is a.length and a[0] right after allocation?

- **A.** 4 and 0
- **B.** 0 and 0
- **C.** 4 and null
- **D.** 3 and 0

**Answer:** A
**Explanation:** length is 4; int elements default to 0.

---

## Quick answer key

Q01–B | Q02–C | Q03–D | Q04–B | Q05–B | Q06–D | Q07–C | Q08–A | Q09–A | Q10–C | Q11–A | Q12–A | Q13–A | Q14–A | Q15–D | Q16–D | Q17–B | Q18–A | Q19–B | Q20–B | Q21–C | Q22–A | Q23–D | Q24–B | Q25–A | Q26–B | Q27–A | Q28–B | Q29–D | Q30–A | Q31–B | Q32–C | Q33–C | Q34–C | Q35–B | Q36–C | Q37–A | Q38–B | Q39–C | Q40–D | Q41–B | Q42–A | Q43–A | Q44–C | Q45–C | Q46–C | Q47–A | Q48–B | Q49–D | Q50–C | Q51–D | Q52–C | Q53–B | Q54–D | Q55–D | Q56–A | Q57–A | Q58–C | Q59–A | Q60–B | Q61–C | Q62–C | Q63–A | Q64–A | Q65–C | Q66–A | Q67–D | Q68–B | Q69–C | Q70–C | Q71–A
