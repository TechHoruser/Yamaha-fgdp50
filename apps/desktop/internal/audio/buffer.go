package audio

type RingBuffer struct {
	data     []float32
	size     int
	writePos int
	readPos  int
}

func NewRingBuffer(size int) *RingBuffer {
	return &RingBuffer{
		data: make([]float32, size),
		size: size,
	}
}

func (r *RingBuffer) Write(samples []float32) int {
	written := 0
	for _, s := range samples {
		r.data[r.writePos%r.size] = s
		r.writePos++
		written++
	}
	return written
}

func (r *RingBuffer) Read(dst []float32) int {
	read := 0
	for i := range dst {
		if r.readPos >= r.writePos {
			break
		}
		dst[i] = r.data[r.readPos%r.size]
		r.readPos++
		read++
	}
	return read
}
