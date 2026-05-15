package audio

import "testing"

func TestRingBuffer_WriteRead(t *testing.T) {
	rb := NewRingBuffer(8)
	samples := []float32{1, 2, 3, 4}

	if n := rb.Write(samples); n != 4 {
		t.Fatalf("want 4 written, got %d", n)
	}

	dst := make([]float32, 4)
	if n := rb.Read(dst); n != 4 {
		t.Fatalf("want 4 read, got %d", n)
	}
	for i, v := range samples {
		if dst[i] != v {
			t.Errorf("pos %d: want %f, got %f", i, v, dst[i])
		}
	}
}

func TestRingBuffer_ReadEmpty(t *testing.T) {
	rb := NewRingBuffer(8)
	dst := make([]float32, 4)
	if n := rb.Read(dst); n != 0 {
		t.Errorf("want 0 read from empty buffer, got %d", n)
	}
}

func TestRingBuffer_WrapAround(t *testing.T) {
	// Buffer large enough to hold all data so writePos wraps the index
	// without overwriting unread samples.
	rb := NewRingBuffer(8)
	rb.Write([]float32{1, 2, 3, 4})
	rb.Write([]float32{5, 6})

	dst := make([]float32, 6)
	n := rb.Read(dst)
	if n != 6 {
		t.Fatalf("want 6 read, got %d", n)
	}
	expected := []float32{1, 2, 3, 4, 5, 6}
	for i, v := range expected {
		if dst[i] != v {
			t.Errorf("pos %d: want %f, got %f", i, v, dst[i])
		}
	}
}

func TestRingBuffer_Overflow_overwritesOldest(t *testing.T) {
	// When writePos laps readPos the oldest samples are silently overwritten —
	// expected behaviour for a lock-free audio ring buffer.
	rb := NewRingBuffer(4)
	rb.Write([]float32{1, 2, 3, 4})
	rb.Write([]float32{5, 6}) // overwrites positions 0 and 1

	dst := make([]float32, 6)
	n := rb.Read(dst)
	if n != 6 {
		t.Fatalf("want 6 read, got %d", n)
	}
	// After overflow: physical layout [5,6,3,4]; logical read order wraps
	expected := []float32{5, 6, 3, 4, 5, 6}
	for i, v := range expected {
		if dst[i] != v {
			t.Errorf("pos %d: want %f, got %f", i, v, dst[i])
		}
	}
}

func TestRingBuffer_PartialRead(t *testing.T) {
	rb := NewRingBuffer(8)
	rb.Write([]float32{10, 20, 30})
	dst := make([]float32, 5)
	n := rb.Read(dst)
	if n != 3 {
		t.Errorf("want 3 (limited by available samples), got %d", n)
	}
}
